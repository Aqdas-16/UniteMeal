const { Client } = require('pg');
async function main() {
    const client = new Client({ connectionString: process.env.VITE_SUPABASE_URL });
    await client.connect();
    
    const res = await client.query(`
        SELECT policyname FROM pg_policies WHERE tablename = 'ngo_volunteers';
    `);
    for (const row of res.rows) {
        await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON ngo_volunteers`);
    }

    await client.query(`ALTER TABLE ngo_volunteers ENABLE ROW LEVEL SECURITY;`);

    // NGOs can view their own volunteers
    await client.query(`CREATE POLICY "NGOs can view their own volunteers" ON ngo_volunteers FOR SELECT TO authenticated USING (ngo_id = auth.uid()::text);`);
    
    // Restaurants can view volunteers assigned to their pickup tasks
    await client.query(`CREATE POLICY "Restaurants can view assigned volunteers" ON ngo_volunteers FOR SELECT TO authenticated USING (id IN (SELECT team_member_id FROM pickup_tasks WHERE restaurant_id = auth.uid()::text));`);

    // NGOs can insert, update, delete their own volunteers
    await client.query(`CREATE POLICY "NGOs can insert their own volunteers" ON ngo_volunteers FOR INSERT TO authenticated WITH CHECK (ngo_id = auth.uid()::text);`);
    await client.query(`CREATE POLICY "NGOs can update their own volunteers" ON ngo_volunteers FOR UPDATE TO authenticated USING (ngo_id = auth.uid()::text) WITH CHECK (ngo_id = auth.uid()::text);`);
    await client.query(`CREATE POLICY "NGOs can delete their own volunteers" ON ngo_volunteers FOR DELETE TO authenticated USING (ngo_id = auth.uid()::text);`);

    console.log("Strict Secure RLS Fixed for ngo_volunteers");
    
    await client.end();
}
main().catch(console.error);
