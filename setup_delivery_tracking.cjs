const { Client } = require('pg');
async function main() {
    const client = new Client({ connectionString: process.env.VITE_SUPABASE_URL });
    await client.connect();

    // Create table
    await client.query(`
        CREATE TABLE IF NOT EXISTS delivery_tracking (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            donation_id TEXT,
            restaurant_id TEXT,
            ngo_id TEXT,
            volunteer_id TEXT,
            status TEXT DEFAULT 'waiting',
            current_latitude DOUBLE PRECISION,
            current_longitude DOUBLE PRECISION,
            destination_latitude DOUBLE PRECISION,
            destination_longitude DOUBLE PRECISION,
            route_distance TEXT,
            distance_remaining TEXT,
            eta_minutes INTEGER,
            started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
            completed_at TIMESTAMP WITH TIME ZONE
        );
    `);

    // Enable RLS
    await client.query(`ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;`);

    // Drop existing policies if any
    const res = await client.query(`SELECT policyname FROM pg_policies WHERE tablename = 'delivery_tracking';`);
    for (const row of res.rows) {
        await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON delivery_tracking`);
    }

    // Policies
    // Volunteers can view their own, insert, update
    // NGOs can view their own
    // Restaurants can view their own
    await client.query(`
        CREATE POLICY "Participants can view delivery tracking" 
        ON delivery_tracking FOR SELECT TO public 
        USING (
            auth.role() = 'anon' OR 
            restaurant_id = auth.uid()::text OR 
            ngo_id = auth.uid()::text OR 
            volunteer_id = auth.uid()::text OR
            volunteer_id IN (SELECT id FROM ngo_volunteers WHERE email = (SELECT email FROM profiles WHERE id = auth.uid()::text limit 1))
        );
    `);

    await client.query(`
        CREATE POLICY "Volunteers and NGOs can insert delivery tracking" 
        ON delivery_tracking FOR INSERT TO public 
        WITH CHECK (auth.role() = 'anon' OR ngo_id = auth.uid()::text OR volunteer_id = auth.uid()::text OR volunteer_id IN (SELECT id FROM ngo_volunteers WHERE email = (SELECT email FROM profiles WHERE id = auth.uid()::text limit 1)));
    `);

    await client.query(`
        CREATE POLICY "Participants can update delivery tracking" 
        ON delivery_tracking FOR UPDATE TO public 
        USING (auth.role() = 'anon' OR ngo_id = auth.uid()::text OR volunteer_id = auth.uid()::text OR volunteer_id IN (SELECT id FROM ngo_volunteers WHERE email = (SELECT email FROM profiles WHERE id = auth.uid()::text limit 1)))
        WITH CHECK (auth.role() = 'anon' OR ngo_id = auth.uid()::text OR volunteer_id = auth.uid()::text OR volunteer_id IN (SELECT id FROM ngo_volunteers WHERE email = (SELECT email FROM profiles WHERE id = auth.uid()::text limit 1)));
    `);

    // Enable realtime
    await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = 'delivery_tracking'
          ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE delivery_tracking;
          END IF;
        END
        $$;
    `);

    console.log("Delivery tracking table created and RLS configured.");
    await client.end();
}
main().catch(console.error);
