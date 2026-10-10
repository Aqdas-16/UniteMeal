const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();
    try {
        await client.query(`NOTIFY pgrst, 'reload schema';`);
        console.log("Schema cache reloaded.");
    } catch (e) {
        console.error(e.message);
    }
    await client.end();
}
run();
