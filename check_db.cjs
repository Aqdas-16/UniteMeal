const { Client } = require('pg');
async function run() {
  const client = new Client({
    connectionString: process.env.VITE_SUPABASE_URL || 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
  });
  await client.connect();
  try {
    const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'requests'`);
    console.log(res.rows.map(r => r.column_name).join(', '));
  } catch(e) {}
  finally { await client.end(); }
}
run();
