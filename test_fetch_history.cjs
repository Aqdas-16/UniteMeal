const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();
async function run() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseAnon = createClient(supabaseUrl.startsWith('postgresql') ? 'https://jcpfgqlhirhcarroxfwx.supabase.co' : supabaseUrl, supabaseKey);
    const { data, error } = await supabaseAnon
        .from('deliveries')
        .select(`
          *,
          donations(title, quantity_kg, unit, donor_id),
          ngos(organization_name, address)
        `)
        .eq('volunteer_id', 'b1vJJ93igAOwEdVEJ2qgvWAvQr33')
        .in('status', ['delivered', 'completed', 'cancelled', 'failed'])
        .order('updated_at', { ascending: false });
        
    console.log(JSON.stringify(data, null, 2), error);
}
run();
