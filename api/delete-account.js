import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: true, message: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({
      error: true,
      message: 'Server tidak terkonfigurasi untuk menghapus akun.',
    });
  }

  // Verify the request has a valid user JWT (from Authorization header)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: true, message: 'Tidak terautentikasi.' });
  }

  const userJwt = authHeader.replace('Bearer ', '');

  // Use anon key to verify the token and get user id
  const supabaseAnon = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(userJwt);

  if (authError || !user) {
    return res.status(401).json({ error: true, message: 'Token tidak valid.' });
  }

  // Use service role to delete the user (hard delete)
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Delete user data first
    await supabaseAdmin.from('transactions').delete().eq('user_id', user.id);
    await supabaseAdmin.from('scanned_receipts').delete().eq('user_id', user.id);
    await supabaseAdmin.from('profiles').delete().eq('id', user.id);

    // Hard-delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return res.status(200).json({ success: true, message: 'Akun berhasil dihapus.' });
  } catch (err) {
    console.error('[/api/delete-account] error:', err);
    return res.status(500).json({
      error: true,
      message: err.message || 'Gagal menghapus akun.',
    });
  }
}
