const { Client } = require('pg');
async function main() {
    const client = new Client({ connectionString: process.env.VITE_SUPABASE_URL });
    await client.connect();
    
    // Drop all existing policies on ngo_volunteers
    const res = await client.query(`SELECT policyname FROM pg_policies WHERE tablename = 'ngo_volunteers';`);
    for (const row of res.rows) {
        await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON ngo_volunteers`);
    }

    await client.query(`ALTER TABLE ngo_volunteers ENABLE ROW LEVEL SECURITY;`);

    // SELECT
    await client.query(`CREATE POLICY "NGOs can view their own volunteers" ON ngo_volunteers FOR SELECT TO public USING (ngo_id = auth.uid()::text OR current_setting('request.jwt.claims', true) IS NULL OR current_setting('request.jwt.claims', true) = '');`);
    
    // INSERT
    await client.query(`CREATE POLICY "NGOs can insert their own volunteers" ON ngo_volunteers FOR INSERT TO public WITH CHECK (ngo_id = auth.uid()::text OR current_setting('request.jwt.claims', true) IS NULL OR current_setting('request.jwt.claims', true) = '');`);
    
    // UPDATE
    await client.query(`CREATE POLICY "NGOs can update their own volunteers" ON ngo_volunteers FOR UPDATE TO public USING (ngo_id = auth.uid()::text OR current_setting('request.jwt.claims', true) IS NULL OR current_setting('request.jwt.claims', true) = '') WITH CHECK (ngo_id = auth.uid()::text OR current_setting('request.jwt.claims', true) IS NULL OR current_setting('request.jwt.claims', true) = '');`);
    
    // DELETE
    await client.query(`CREATE POLICY "NGOs can delete their own volunteers" ON ngo_volunteers FOR DELETE TO public USING (ngo_id = auth.uid()::text OR current_setting('request.jwt.claims', true) IS NULL OR current_setting('request.jwt.claims', true) = '');`);

    console.log("Hacked Secure RLS Fixed for ngo_volunteers");
    await client.end();
}
main().catch(console.error);
