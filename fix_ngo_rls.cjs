const { Client } = require('pg');

async function fix() {
  const client = new Client({
    connectionString: process.env.VITE_SUPABASE_URL
  });
  
  await client.connect();
  
  try {
    await client.query(`
      DROP POLICY IF EXISTS "NGO update deliveries" ON deliveries;
    `);
    console.log('Removed NGO update policy, making NGO read-only for deliveries.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
fix();
