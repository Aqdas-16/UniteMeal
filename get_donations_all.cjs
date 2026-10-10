const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();
    const res = await client.query(`SELECT id, title, status, created_at FROM donations ORDER BY created_at DESC LIMIT 10;`);
    console.log(res.rows);
    await client.end();
}
run();
