const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();
async function run() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseAdmin = createClient(supabaseUrl.startsWith('postgresql') ? 'https://jcpfgqlhirhcarroxfwx.supabase.co' : supabaseUrl, supabaseKey);
    
    const { data: d, error: err } = await supabaseAdmin.from('deliveries').select('*').in('status', ['accepted', 'heading_to_restaurant', 'arrived_restaurant', 'picked_up', 'heading_to_ngo', 'arrived_ngo']).eq('volunteer_id', 'b1vJJ93igAOwEdVEJ2qgvWAvQr33');
    console.log("Deliveries:", d);
}
run();
