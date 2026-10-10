const { Client } = require('pg');
const connectionString = process.env.VITE_SUPABASE_URL;

async function check() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'deliveries';
  `);
  console.log(res.rows);
  await client.end();
}
check();
