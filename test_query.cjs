const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env'});

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('deliveries')
    .select('*, donations(*), ngo:ngos(*), volunteer:profiles!deliveries_volunteer_id_fkey(*)')
    .limit(1);
    
  console.log("Error profiles!fkey:", error?.message || 'None');
  
  const { data: d2, error: e2 } = await supabase.from('deliveries')
    .select('*, donations(*), ngo:ngos(*), volunteer:volunteers(*, profiles(*))')
    .limit(1);
    
  console.log("Error volunteers(*):", e2?.message || 'None');
}
test();
