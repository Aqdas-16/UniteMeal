require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data, error } = await supabase
      .from('donations')
      .select('*, profiles:donor_id(full_name, avatar_url), donors:donor_id(organization_name)')
      .eq('status', 'available')
      .limit(10);
    console.log("Error:", error);
    console.log("Data:", data);
}
test();
