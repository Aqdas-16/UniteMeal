const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const realUrl = supabaseUrl.startsWith('postgresql') ? 'https://jcpfgqlhirhcarroxfwx.supabase.co' : supabaseUrl;
const supabaseAdmin = createClient(realUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function run() {
  const userId = "test-id";
  const { error: profErr } = await supabaseAdmin.from('profiles').upsert({
    id: userId,
    full_name: 'test',
    email: 'test@unitemeal.org',
    phone_number: '123',
    role: 'volunteer'
  });
  console.log("Prof Err:", profErr);
}
run();
