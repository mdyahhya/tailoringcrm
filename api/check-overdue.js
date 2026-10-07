// api/check-overdue.js
// Vercel Serverless Function & Cron Job: Tailoring Overdue Tracker

const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const {
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
    VAPID_SUBJECT = 'mailto:ctgroupteam@gmail.com',
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Supabase configuration missing' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Fetch in-progress orders past their expected delivery date
    const { data: overdueOrders, error: orderErr } = await supabase
      .from('orders')
      .select('id, order_no, garment_type, expected_delivery_date, current_stage, customers(name)')
      .not('status', 'in', '("delivered","cancelled")')
      .lt('expected_delivery_date', todayStr);

    if (orderErr) {
      return res.status(500).json({ error: orderErr.message });
    }

    // 2. Fetch in-progress stages past their estimated date
    const { data: overdueStages, error: stageErr } = await supabase
      .from('order_stages')
      .select('id, order_id, stage, estimated_date, employee_name_snapshot, orders(order_no, garment_type, customers(name))')
      .eq('status', 'in_progress')
      .lt('estimated_date', todayStr);

    if (stageErr) {
      return res.status(500).json({ error: stageErr.message });
    }

    let notifiedCount = 0;

    // Check recent notifications from past 24 hours to avoid spamming
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentNotifications } = await supabase
      .from('notifications')
      .select('order_id, stage')
      .gte('created_at', yesterday);

    const recentOrderSet = new Set((recentNotifications || []).map((n) => `${n.order_id}:${n.stage}`));

    const notificationsToInsert = [];

    // Process overdue delivery dates
    for (const order of (overdueOrders || [])) {
      const key = `${order.id}:overdue_delivery`;
      if (!recentOrderSet.has(key)) {
        const custName = (order.customers && order.customers.name) ? order.customers.name : 'Customer';
        notificationsToInsert.push({
          order_id: order.id,
          stage: 'overdue_delivery',
          title: `Overdue Delivery: ${order.order_no}`,
          body: `Order ${order.order_no} for ${custName} (${order.garment_type}) passed expected delivery date (${order.expected_delivery_date}).`
        });
        recentOrderSet.add(key);
      }
    }

    // Process overdue stage estimates
    for (const stg of (overdueStages || [])) {
      const key = `${stg.order_id}:${stg.stage}_overdue`;
      if (!recentOrderSet.has(key)) {
        const orderInfo = stg.orders || {};
        const custName = (orderInfo.customers && orderInfo.customers.name) ? orderInfo.customers.name : 'Customer';
        const emp = stg.employee_name_snapshot || 'Assigned staff';
        notificationsToInsert.push({
          order_id: stg.order_id,
          stage: `${stg.stage}_overdue`,
          title: `Stage Overdue: ${orderInfo.order_no || 'Order'}`,
          body: `${stg.stage.toUpperCase()} for ${orderInfo.order_no} (${custName}) with ${emp} passed estimate date (${stg.estimated_date}).`
        });
        recentOrderSet.add(key);
      }
    }

    if (notificationsToInsert.length > 0) {
      const { error: insertErr } = await supabase
        .from('notifications')
        .insert(notificationsToInsert);

      if (!insertErr) {
        notifiedCount = notificationsToInsert.length;

        // Trigger push notifications if VAPID keys are configured
        if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
          try {
            webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
            const { data: subs } = await supabase.from('push_subscriptions').select('*');

            if (subs && subs.length > 0) {
              for (const note of notificationsToInsert) {
                const payload = JSON.stringify({
                  title: note.title,
                  body: note.body,
                  stage: note.stage,
                  order_id: note.order_id,
                  url: `/order-detail.html?id=${note.order_id}`
                });

                for (const sub of subs) {
                  try {
                    await webpush.sendNotification({
                      endpoint: sub.endpoint,
                      keys: { p256dh: sub.p256dh, auth: sub.auth }
                    }, payload, { TTL: 86400, urgency: 'high' });
                  } catch (e) {
                    // Suppress individual push errors in cron
                  }
                }
              }
            }
          } catch (pushConfigErr) {
            console.error('Push broadcast error in cron:', pushConfigErr.message);
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      overdueOrdersFound: (overdueOrders || []).length,
      overdueStagesFound: (overdueStages || []).length,
      notificationsGenerated: notifiedCount
    });
  } catch (err) {
    console.error('Check overdue error:', err);
    return res.status(500).json({ error: err.message });
  }
};
