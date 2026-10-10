import 'dotenv/config';
import { Client } from 'pg';

async function fix() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected");

  await client.query(`
    ALTER TABLE audit_logs ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
  `);
  
  console.log("Fixed audit_logs default id.");
  await client.end();
}
fix().catch(console.error);
