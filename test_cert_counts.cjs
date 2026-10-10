const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: ngoData, error: ngoErr } = await supabase.from('donations').select('id, ngo_id, status').limit(5);
  console.log("NGO donations:", ngoData, ngoErr);
  
  const { data: volData, error: volErr } = await supabase.from('pickup_tasks').select('*').limit(5);
  console.log("Pickup tasks:", volData, volErr);
  
  const { data: deliveriesData, error: deliveriesErr } = await supabase.from('deliveries').select('id, volunteer_id, status').limit(5);
  console.log("Deliveries:", deliveriesData, deliveriesErr);
}
run();
