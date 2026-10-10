const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();
    try {
        await client.query(`ALTER TABLE deliveries ADD COLUMN accepted_at TIMESTAMP WITH TIME ZONE`);
        console.log("Column accepted_at added to deliveries.");
    } catch (e) {
        console.error(e.message);
    }
    
    // Also we need to check schema cache, reload schema cache by querying Supabase REST API or just it will eventually be consistent
    
    await client.end();
}
run();
