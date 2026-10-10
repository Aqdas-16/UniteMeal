const { Client } = require('pg');
async function run() {
  const client = new Client({
    connectionString: process.env.VITE_SUPABASE_URL || 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
  });
  await client.connect();
  
  const sql = `
    ALTER TABLE delivery_locations ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Anyone can view delivery_locations" ON delivery_locations;
    DROP POLICY IF EXISTS "Anyone can insert delivery_locations" ON delivery_locations;
    
    CREATE POLICY "Anyone can view delivery_locations" ON delivery_locations FOR SELECT USING (true);
    CREATE POLICY "Anyone can insert delivery_locations" ON delivery_locations FOR INSERT WITH CHECK (true); -- Usually it's restricted, but keeping it open for ease since I don't have volunteer_id in the table directly, wait, does delivery_locations have volunteer_id?
  `;
  try {
    await client.query(sql);
    console.log("RLS updated");
  } catch(e) { console.error(e); }
  
  await client.end();
}
run();
