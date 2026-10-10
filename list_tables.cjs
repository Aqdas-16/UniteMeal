const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase.from('pickup_tasks').select('id').limit(1);
    console.log("pickup_tasks exists:", !error || error.code !== '42P01');
    const { data: vData, error: vErr } = await supabase.from('ngo_volunteers').select('id').limit(1);
    console.log("ngo_volunteers exists:", !vErr || vErr.code !== '42P01');
    const { data: tData, error: tErr } = await supabase.from('tracking_locations').select('id').limit(1);
    console.log("tracking_locations exists:", !tErr || tErr.code !== '42P01');
}
main();
