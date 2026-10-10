const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();
    await client.query(`
        ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS ngo_rating INTEGER CHECK (ngo_rating >= 1 AND ngo_rating <= 5);
        ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS ngo_feedback TEXT;
        NOTIFY pgrst, 'reload schema';
    `);
    console.log("Done");
    await client.end();
}
run();
