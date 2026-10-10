const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();
async function run() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseAnon = createClient(supabaseUrl.startsWith('postgresql') ? 'https://jcpfgqlhirhcarroxfwx.supabase.co' : supabaseUrl, supabaseKey);
    const { data: n } = await supabaseAnon.from('ngos').select('*').limit(1);
    const { data: r } = await supabaseAnon.from('restaurants').select('*').limit(1);
    console.log("NGO keys:", n ? Object.keys(n[0]) : null);
    console.log("Restaurant keys:", r ? Object.keys(r[0]) : null);
}
run();
