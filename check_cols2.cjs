const { Client } = require('pg');
async function run() {
  const client = new Client({
    connectionString: process.env.VITE_SUPABASE_URL || 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
  });
  await client.connect();
  const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'donations'`);
  console.log('donations:', res.rows.map(r => r.column_name).join(', '));
  await client.end();
}
run();
