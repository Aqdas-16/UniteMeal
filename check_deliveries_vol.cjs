const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();
async function run() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = createClient(supabaseUrl.startsWith('postgresql') ? 'https://jcpfgqlhirhcarroxfwx.supabase.co' : supabaseUrl, supabaseKey);
    const { data: d, error: err } = await supabaseAdmin.from('deliveries').select('*').in('status', ['completed', 'delivered', 'cancelled']);
    console.log("Deliveries:", d);
    if(err) console.error("Error:", err);
}
run();
