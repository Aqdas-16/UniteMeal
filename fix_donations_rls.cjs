const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: process.env.VITE_SUPABASE_URL || 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();
    
    // Add permissive policy for updating donations (or specific to NGOs)
    // To be safe and simple, let's allow authenticated users to update donations.
    await client.query(`
        DROP POLICY IF EXISTS "NGOs can update donations" ON donations;
        CREATE POLICY "NGOs can update donations" ON donations FOR UPDATE USING (true);
    `);
    
    console.log("RLS policy updated for donations.");
    await client.end();
}
run();
