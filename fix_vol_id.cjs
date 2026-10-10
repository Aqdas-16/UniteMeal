const { Client } = require('pg');
async function main() {
    const client = new Client({ connectionString: process.env.VITE_SUPABASE_URL });
    await client.connect();
    
    // Add extension if not exists
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    
    // Alter column id to set default
    await client.query(`ALTER TABLE ngo_volunteers ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;`);
    
    console.log("Set default for id in ngo_volunteers");
    await client.end();
}
main().catch(console.error);
