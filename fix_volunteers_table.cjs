const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();
    try {
        await client.query(`ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS ngo_id uuid REFERENCES profiles(id)`);
        console.log("Added ngo_id to volunteers table");
    } catch (e) {
        console.log("Error:", e.message);
    }
    await client.end();
}
run();
