const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();
    const res = await client.query(`
        SELECT polname, polcmd, polqual, polwithcheck
        FROM pg_policy
        WHERE polrelid = 'deliveries'::regclass
    `);
    console.log(res.rows);
    await client.end();
}
run();
