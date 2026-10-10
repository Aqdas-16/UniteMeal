const { Client } = require('pg');
async function run() {
  const client = new Client({
    connectionString: process.env.VITE_SUPABASE_URL || 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
  });
  await client.connect();
  
  const sql = `
    ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view deliveries" ON deliveries;
    DROP POLICY IF EXISTS "NGOs can insert deliveries" ON deliveries;
    DROP POLICY IF EXISTS "Volunteers and NGOs can update deliveries" ON deliveries;
    
    CREATE POLICY "Users can view deliveries" ON deliveries
      FOR SELECT
      USING (true);
      
    CREATE POLICY "NGOs can insert deliveries" ON deliveries
      FOR INSERT
      WITH CHECK (auth.uid()::text = ngo_id);
      
    CREATE POLICY "Volunteers and NGOs can update deliveries" ON deliveries
      FOR UPDATE
      USING (auth.uid()::text = volunteer_id OR auth.uid()::text = ngo_id);
  `;
  try {
    await client.query(sql);
    console.log("RLS updated");
  } catch(e) { console.error(e); }
  
  await client.end();
}
run();
