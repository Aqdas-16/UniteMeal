const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();
    const res = await client.query(`SELECT prosrc FROM pg_proc WHERE proname = 'log_audit_action'`);
    console.log(res.rows[0].prosrc);
    await client.end();
}
run();
