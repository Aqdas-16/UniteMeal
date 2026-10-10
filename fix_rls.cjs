const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();
    try {
        await client.query(`ALTER TABLE deliveries DISABLE ROW LEVEL SECURITY;`);
        console.log("RLS disabled on deliveries.");
    } catch (e) {
        console.error(e.message);
    }
    await client.end();
}
run();
