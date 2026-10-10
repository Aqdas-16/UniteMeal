const { Client } = require('pg');

async function fix() {
  const client = new Client({
    connectionString: process.env.VITE_SUPABASE_URL
  });
  
  await client.connect();
  
  try {
    await client.query(`
      ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
      ALTER TABLE delivery_locations ENABLE ROW LEVEL SECURITY;
      
      -- Restaurant can read their own donations' deliveries
      DROP POLICY IF EXISTS "Restaurant read own deliveries" ON deliveries;
      CREATE POLICY "Restaurant read own deliveries" ON deliveries
        FOR SELECT
        USING (donation_id IN (SELECT id FROM donations WHERE donor_id = auth.uid()::text));

      -- NGO can read assigned deliveries
      DROP POLICY IF EXISTS "NGO read own deliveries" ON deliveries;
      CREATE POLICY "NGO read own deliveries" ON deliveries
        FOR SELECT
        USING (ngo_id = auth.uid()::text);

      -- Volunteer can read assigned deliveries
      DROP POLICY IF EXISTS "Volunteer read assigned deliveries" ON deliveries;
      CREATE POLICY "Volunteer read assigned deliveries" ON deliveries
        FOR SELECT
        USING (volunteer_id = auth.uid()::text);
        
      -- Volunteer can update their own deliveries
      DROP POLICY IF EXISTS "Volunteer update own deliveries" ON deliveries;
      CREATE POLICY "Volunteer update own deliveries" ON deliveries
        FOR UPDATE
        USING (volunteer_id = auth.uid()::text);
        
      -- Delivery locations policies
      DROP POLICY IF EXISTS "Restaurant read locations" ON delivery_locations;
      CREATE POLICY "Restaurant read locations" ON delivery_locations
        FOR SELECT
        USING (delivery_id IN (SELECT id FROM deliveries WHERE donation_id IN (SELECT id FROM donations WHERE donor_id = auth.uid()::text)));

      DROP POLICY IF EXISTS "NGO read locations" ON delivery_locations;
      CREATE POLICY "NGO read locations" ON delivery_locations
        FOR SELECT
        USING (delivery_id IN (SELECT id FROM deliveries WHERE ngo_id = auth.uid()::text));

      DROP POLICY IF EXISTS "Volunteer read locations" ON delivery_locations;
      CREATE POLICY "Volunteer read locations" ON delivery_locations
        FOR SELECT
        USING (delivery_id IN (SELECT id FROM deliveries WHERE volunteer_id = auth.uid()::text));
        
      DROP POLICY IF EXISTS "Volunteer insert locations" ON delivery_locations;
      CREATE POLICY "Volunteer insert locations" ON delivery_locations
        FOR INSERT
        WITH CHECK (delivery_id IN (SELECT id FROM deliveries WHERE volunteer_id = auth.uid()::text));
        
      DROP POLICY IF EXISTS "NGO insert deliveries" ON deliveries;
      CREATE POLICY "NGO insert deliveries" ON deliveries
        FOR INSERT
        WITH CHECK (ngo_id = auth.uid()::text);

      DROP POLICY IF EXISTS "NGO update deliveries" ON deliveries;
      CREATE POLICY "NGO update deliveries" ON deliveries
        FOR UPDATE
        USING (ngo_id = auth.uid()::text);

      -- Restaurant can update donations
      DROP POLICY IF EXISTS "Restaurant update donations" ON donations;
      CREATE POLICY "Restaurant update donations" ON donations
        FOR UPDATE
        USING (donor_id = auth.uid()::text);
    `);
    console.log('RLS applied');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
fix();
