const { Client } = require('pg');
const connectionString = process.env.VITE_SUPABASE_URL;

async function setup() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.ngo_volunteers (
        id TEXT PRIMARY KEY,
        ngo_id TEXT,
        name TEXT NOT NULL,
        phone TEXT,
        photo TEXT,
        status TEXT DEFAULT 'Available',
        current_latitude DOUBLE PRECISION,
        current_longitude DOUBLE PRECISION,
        assigned_donation_id TEXT,
        availability BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
    `);
    
    // Check if assigned_volunteer_id exists in donations
    const res = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'donations' AND column_name = 'assigned_volunteer_id';
    `);
    
    if (res.rows.length === 0) {
      await client.query(`ALTER TABLE public.donations ADD COLUMN assigned_volunteer_id TEXT;`);
    }

    console.log("Database updated successfully");
  } catch (err) {
    console.error("Error updating database", err);
  } finally {
    await client.end();
  }
}
setup();
