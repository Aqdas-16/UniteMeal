const { Client } = require('pg');
async function run() {
  const client = new Client({
    connectionString: process.env.VITE_SUPABASE_URL || 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
  });
  await client.connect();
  const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'volunteers'`);
  console.log('volunteers:', res.rows.map(r => r.column_name).join(', '));
  const res2 = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'`);
  console.log('profiles:', res2.rows.map(r => r.column_name).join(', '));
  await client.end();
}
run();
