const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();
async function run() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseAdmin = createClient(supabaseUrl.startsWith('postgresql') ? 'https://jcpfgqlhirhcarroxfwx.supabase.co' : supabaseUrl, supabaseKey);
    
    // sign in as the volunteer
    const { data: authData, error: authErr } = await supabaseAdmin.auth.signInWithPassword({
        email: 'mike123@volunteer.unitemeal.org',
        password: 'password123'
    });
    
    console.log("Auth err:", authErr);
    
    const { data: d, error: err } = await supabaseAdmin.from('deliveries').select('*').eq('status', 'assigned');
    console.log("Deliveries:", d);
    
    if(d && d.length > 0) {
        const did = d[0].id;
        const updates = { status: 'accepted', accepted_at: new Date().toISOString() };
        console.log("Updating:", did);
        const { data: ud, error: uerr } = await supabaseAdmin.from('deliveries').update(updates).eq('id', did).select();
        console.log("Update err:", uerr, ud);
    }
}
run();
