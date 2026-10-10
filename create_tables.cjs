const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const connectionString = process.env.VITE_SUPABASE_URL;

async function run() {
    const client = new Client({ connectionString });
    await client.connect();
    
    // Create NGO Team
    await client.query(`
        CREATE TABLE IF NOT EXISTS ngo_team (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            ngo_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            photo TEXT,
            designation TEXT,
            vehicle_type TEXT,
            vehicle_number TEXT,
            status TEXT DEFAULT 'Offline',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    `);
    
    // Check if donations table needs to be updated with new columns (if any)
    try {
        await client.query(`ALTER TABLE donations ADD COLUMN ngo_id TEXT REFERENCES profiles(id) ON DELETE CASCADE;`);
    } catch(e) {}
    try {
        await client.query(`ALTER TABLE donations ADD COLUMN pickup_start TIMESTAMP WITH TIME ZONE;`);
        await client.query(`ALTER TABLE donations ADD COLUMN pickup_end TIMESTAMP WITH TIME ZONE;`);
    } catch(e) {}
    try {
        await client.query(`ALTER TABLE donations ADD COLUMN latitude NUMERIC;`);
        await client.query(`ALTER TABLE donations ADD COLUMN longitude NUMERIC;`);
        await client.query(`ALTER TABLE donations ADD COLUMN address TEXT;`);
        await client.query(`ALTER TABLE donations ADD COLUMN city TEXT;`);
        await client.query(`ALTER TABLE donations ADD COLUMN state TEXT;`);
        await client.query(`ALTER TABLE donations ADD COLUMN postal_code TEXT;`);
    } catch(e) {}

    // Create Pickup Tasks (using TEXT for user IDs, UUID for system-generated IDs)
    // Wait, donation_id is typically UUID or TEXT? Let's check what it is in the database.
    const res = await client.query("SELECT data_type FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'id'");
    const donIdType = res.rows[0]?.data_type || 'UUID';
    
    await client.query(`
        CREATE TABLE IF NOT EXISTS pickup_tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            donation_id ${donIdType === 'uuid' ? 'UUID' : 'TEXT'} NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
            restaurant_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            ngo_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            team_member_id UUID REFERENCES ngo_team(id) ON DELETE SET NULL,
            status TEXT DEFAULT 'assigned',
            assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
            started_at TIMESTAMP WITH TIME ZONE,
            arrived_at TIMESTAMP WITH TIME ZONE,
            picked_up_at TIMESTAMP WITH TIME ZONE,
            completed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    `);
    
    // Create Tracking Table
    await client.query(`
        CREATE TABLE IF NOT EXISTS tracking_locations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            pickup_task_id UUID REFERENCES pickup_tasks(id) ON DELETE CASCADE,
            team_member_id UUID REFERENCES ngo_team(id) ON DELETE CASCADE,
            latitude NUMERIC NOT NULL,
            longitude NUMERIC NOT NULL,
            speed NUMERIC,
            heading NUMERIC,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    `);

    console.log("Tables created/updated");
    await client.end();
}
run();
