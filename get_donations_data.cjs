const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();
    const res = await client.query(`SELECT id, status, ngo_id, donor_id FROM donations LIMIT 5;`);
    console.log(res.rows);
    await client.end();
}
run();
