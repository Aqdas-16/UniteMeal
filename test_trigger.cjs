const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();
    const res = await client.query(`SELECT event_object_table, trigger_name, action_statement FROM information_schema.triggers`);
    console.log(res.rows.filter(r => r.action_statement.includes('audit_logs') || r.trigger_name.includes('audit')));
    await client.end();
}
run();
