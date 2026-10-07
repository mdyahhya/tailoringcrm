// api/send-push.js
// Vercel Serverless Function: Web Push Notification Dispatcher (Node.js runtime)

const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-webhook-secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
    VAPID_SUBJECT = 'mailto:ctgroupteam@gmail.com',
    SUPABASE_URL = process.env.SUPABASE_URL || 'https://ajapvxdpxifdhvvszuhp.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY,
    PUSH_WEBHOOK_SECRET = 'iqbal_tailoring_webhook_secret_2025'
  } = process.env;

  // 1. Security Check: Verify Webhook Secret OR Supabase User JWT FIRST
  const authHeader = req.headers['authorization'] || '';
  const webhookSecretHeader = req.headers['x-webhook-secret'] || '';
  let authenticatedUserId = null;

  const isWebhookSecretValid = PUSH_WEBHOOK_SECRET && (
    webhookSecretHeader === PUSH_WEBHOOK_SECRET ||
    authHeader === `Bearer ${PUSH_WEBHOOK_SECRET}`
  );

  if (!isWebhookSecretValid) {
    // If not webhook secret, verify if user sent a valid Supabase JWT
    if (authHeader.startsWith('Bearer ') && SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
      if (error || !user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token or webhook secret' });
      }
      authenticatedUserId = user.id;
    } else {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid secret header' });
    }
  }

  // Handle test ping payload
  const bodyData = req.body || {};
  if (bodyData.type === 'test') {
    return res.status(200).json({ success: true, message: 'Test webhook accepted', title: bodyData.title });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Missing Supabase server configuration' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // Handle subscription renewal from service worker
  if (req.query.action === 'renew') {
    try {
      const { oldEndpoint, newSubscription } = req.body || {};
      if (oldEndpoint && newSubscription) {
        await supabase
          .from('push_subscriptions')
          .update({
            endpoint: newSubscription.endpoint,
            p256dh: newSubscription.keys.p256dh,
            auth: newSubscription.keys.auth,
            last_used_at: new Date().toISOString()
          })
          .eq('endpoint', oldEndpoint);
      }
      return res.status(200).json({ success: true, message: 'Subscription renewed' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Configure Web Push VAPID keys
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return res.status(200).json({ success: true, sentCount: 0, message: 'VAPID keys not configured in environment' });
  }

  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  } catch (err) {
    return res.status(500).json({ error: `VAPID configuration error: ${err.message}` });
  }

  // Parse notification content
  // Supabase Database Webhook passes: { type, table, record, old_record }
  let title = bodyData.title;
  let body = bodyData.body;
  let stage = bodyData.stage;
  let orderId = bodyData.order_id;
  let targetUserId = bodyData.user_id;

  if (bodyData.record) {
    // Webhook format from notifications table
    title = bodyData.record.title || title;
    body = bodyData.record.body || body;
    stage = bodyData.record.stage || stage;
    orderId = bodyData.record.order_id || orderId;
    targetUserId = bodyData.record.user_id || targetUserId;
  }

  if (!title || !body) {
    title = 'Iqbal Fashion Tailoring CRM';
    body = 'An order in your tailoring pipeline has been updated.';
  }

  const payload = JSON.stringify({
    title,
    body,
    stage: stage || '',
    order_id: orderId || '',
    url: orderId ? `/order-detail.html?id=${orderId}` : '/orders.html'
  });

  try {
    // Query subscriptions
    let query = supabase.from('push_subscriptions').select('*');
    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    }
    const { data: subscriptions, error: dbError } = await query;

    if (dbError) {
      return res.status(500).json({ error: dbError.message });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active push subscriptions found',
        sentCount: 0
      });
    }

    let sentCount = 0;
    let failedCount = 0;
    const deadSubscriptionIds = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        try {
          await webpush.sendNotification(pushSubscription, payload, {
            TTL: 86400, // 24 hours
            urgency: 'high'
          });
          sentCount++;
        } catch (pushErr) {
          failedCount++;
          // HTTP 404 Not Found or 410 Gone means the subscription has expired or unsubscribed
          if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
            deadSubscriptionIds.push(sub.id);
          } else {
            console.error('Web push error for endpoint:', sub.endpoint, pushErr.message);
          }
        }
      })
    );

    // Prune dead subscriptions automatically
    if (deadSubscriptionIds.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', deadSubscriptionIds);
    }

    return res.status(200).json({
      success: true,
      sentCount,
      failedCount,
      prunedDeadSubscriptions: deadSubscriptionIds.length
    });
  } catch (err) {
    console.error('Serverless send-push failure:', err);
    return res.status(500).json({ error: err.message });
  }
};
