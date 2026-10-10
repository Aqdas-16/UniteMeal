const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();
    const res = await client.query(`SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'donations';`);
    console.log(res.rows);
    await client.end();
}
run();
