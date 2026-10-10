const { Client } = require('pg');
async function main() {
    const client = new Client({ connectionString: process.env.VITE_SUPABASE_URL });
    await client.connect();
    
    // Drop all existing policies on ngo_volunteers
    const res = await client.query(`SELECT policyname FROM pg_policies WHERE tablename = 'ngo_volunteers';`);
    for (const row of res.rows) {
        await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON ngo_volunteers`);
    }

    // SELECT
    await client.query(`CREATE POLICY "NGOs can view their own volunteers" ON ngo_volunteers FOR SELECT TO public USING (auth.role() = 'anon' OR ngo_id = auth.uid()::text);`);
    
    // INSERT
    await client.query(`CREATE POLICY "NGOs can insert their own volunteers" ON ngo_volunteers FOR INSERT TO public WITH CHECK (auth.role() = 'anon' OR ngo_id = auth.uid()::text);`);
    
    // UPDATE
    await client.query(`CREATE POLICY "NGOs can update their own volunteers" ON ngo_volunteers FOR UPDATE TO public USING (auth.role() = 'anon' OR ngo_id = auth.uid()::text) WITH CHECK (auth.role() = 'anon' OR ngo_id = auth.uid()::text);`);
    
    // DELETE
    await client.query(`CREATE POLICY "NGOs can delete their own volunteers" ON ngo_volunteers FOR DELETE TO public USING (auth.role() = 'anon' OR ngo_id = auth.uid()::text);`);

    console.log("Role-based Secure RLS Fixed for ngo_volunteers");
    await client.end();
}
main().catch(console.error);
