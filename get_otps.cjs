const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();
async function run() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseAdmin = createClient(supabaseUrl.startsWith('postgresql') ? 'https://jcpfgqlhirhcarroxfwx.supabase.co' : supabaseUrl, supabaseKey);
    
    const { data: d, error: err } = await supabaseAdmin.from('deliveries').select('id, status, pickup_otp, delivery_otp').eq('status', 'arrived_restaurant').or('status.eq.accepted').or('status.eq.heading_to_restaurant').limit(5);
    console.log("Deliveries:", d);
}
run();
