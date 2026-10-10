const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();
async function run() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseAdmin = createClient(supabaseUrl.startsWith('postgresql') ? 'https://jcpfgqlhirhcarroxfwx.supabase.co' : supabaseUrl, supabaseKey);
    
    const { data: d, error: err } = await supabaseAdmin.from('deliveries').select(`
          *,
          donations!inner(*, profiles(full_name)),
          volunteers(profiles(full_name))
        `).eq('ngo_id', 'GvGYpHmsJGXtAw38YMhCntqTkVC2').limit(2);
    console.log("Deliveries:", JSON.stringify(d, null, 2));
    console.log("Err:", err);
}
run();
