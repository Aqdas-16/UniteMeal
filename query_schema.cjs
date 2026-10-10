const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function check() {
    const { data } = await supabase.from('restaurants').select('*').limit(1);
    console.log("Restaurants columns:", data ? Object.keys(data[0] || {}) : "No data");
}
check();
