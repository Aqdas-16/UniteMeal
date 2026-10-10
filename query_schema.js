const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    // Try to get 1 row from restaurants to see what columns exist
    const { data, error } = await supabase.from('restaurants').select('*').limit(1);
    console.log("Restaurants:", data ? Object.keys(data[0] || {}) : "No data", error);
    
    const { data: dData, error: dError } = await supabase.from('donors').select('*').limit(1);
    console.log("Donors:", dData ? Object.keys(dData[0] || {}) : "No data", dError);
}
check();
