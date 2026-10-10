const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: process.env.VITE_SUPABASE_URL || 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();
    
    // Add permissive policy for deliveries
    await client.query(`
        DROP POLICY IF EXISTS "NGO insert deliveries" ON deliveries;
        DROP POLICY IF EXISTS "NGOs can insert deliveries" ON deliveries;
        CREATE POLICY "NGO insert deliveries" ON deliveries FOR INSERT WITH CHECK (true);
    `);
    
    console.log("RLS policy updated for deliveries.");
    await client.end();
}
run();
