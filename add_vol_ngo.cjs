const { Client } = require('pg');
async function run() {
  const client = new Client({
    connectionString: process.env.VITE_SUPABASE_URL || 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
  });
  await client.connect();
  try {
    await client.query(`ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS ngo_id TEXT REFERENCES ngos(id) ON DELETE CASCADE;`);
    console.log("Added ngo_id to volunteers");
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
