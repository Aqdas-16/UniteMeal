const { Client } = require('pg');
async function run() {
  const client = new Client({
    connectionString: process.env.VITE_SUPABASE_URL || 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
  });
  await client.connect();
  
  try {
    await client.query("ALTER TABLE requests ADD COLUMN IF NOT EXISTS category TEXT;");
    await client.query("ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;");
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("Fixed requests schema");
  } catch(e) { console.error(e); }
  
  await client.end();
}
run();
