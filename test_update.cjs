const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();
async function run() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = createClient(supabaseUrl.startsWith('postgresql') ? 'https://jcpfgqlhirhcarroxfwx.supabase.co' : supabaseUrl, supabaseKey);
    
    // Attempt to manually update the active delivery to 'accepted'
    // First find an active delivery
    const { data: d, error: err } = await supabaseAdmin.from('deliveries').select('id, status').eq('status', 'assigned').limit(1);
    console.log("Found:", d, err);
    if(d && d.length > 0) {
        const did = d[0].id;
        const updates = { status: 'accepted', accepted_at: new Date().toISOString() };
        console.log("Updating:", did, "with", updates);
        const { data: ud, error: uerr } = await supabaseAdmin.from('deliveries').update(updates).eq('id', did).select();
        console.log("Result:", ud, uerr);
    }
}
run();
