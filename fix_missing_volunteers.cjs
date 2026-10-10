const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: profiles } = await supabase.from('profiles').select('id, role, full_name');
    for (const p of profiles) {
        if (p.role === 'volunteer') {
            await supabase.from('volunteers').upsert({ id: p.id });
        } else if (p.role === 'donor') {
            await supabase.from('donors').upsert({ id: p.id, donor_type: 'restaurant', organization_name: p.full_name || 'Donor' });
        } else if (p.role === 'ngo') {
            await supabase.from('ngos').upsert({ id: p.id, organization_name: p.full_name || 'NGO' });
        }
    }
    console.log("Done syncing missing profile sub-tables");
}
run();
