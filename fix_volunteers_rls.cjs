const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();
    await client.query(`
        DROP POLICY IF EXISTS "volunteers_all" ON volunteers;
        CREATE POLICY "volunteers_all" ON volunteers FOR ALL USING (true) WITH CHECK (true);
    `);
    console.log("RLS policy updated for volunteers.");
    await client.end();
}
run();
