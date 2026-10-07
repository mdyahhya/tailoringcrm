// api/create-user.js
// Vercel Serverless Function: Admin Staff User Provisioning

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Supabase configuration missing' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // Verify caller's JWT & Admin status
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user: callerUser }, error: tokenErr } = await supabase.auth.getUser(token);

  if (tokenErr || !callerUser) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }

  // Check role in profiles
  const { data: callerProfile, error: profErr } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', callerUser.id)
    .single();

  if (profErr || !callerProfile || callerProfile.role !== 'admin' || !callerProfile.is_active) {
    return res.status(403).json({ error: 'Access denied: Only administrators can create new users' });
  }

  const { email, password, full_name, role } = req.body || {};

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const userRole = (role === 'admin') ? 'admin' : 'manager';

  try {
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name.trim(),
        role: userRole
      }
    });

    if (createErr) {
      return res.status(400).json({ error: createErr.message });
    }

    // Ensure profiles record is updated with exact role & name
    await supabase
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        full_name: full_name.trim(),
        role: userRole,
        is_active: true
      });

    return res.status(200).json({
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        full_name: full_name.trim(),
        role: userRole
      }
    });
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({ error: err.message });
  }
};
