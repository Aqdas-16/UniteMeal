const { Client } = require('pg');
const connectionString = process.env.VITE_SUPABASE_URL;

async function setup() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    
    // Create ngo_volunteers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.ngo_volunteers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ngo_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        phone TEXT,
        photo TEXT,
        status TEXT DEFAULT 'Available',
        current_latitude DOUBLE PRECISION,
        current_longitude DOUBLE PRECISION,
        assigned_donation_id UUID,
        availability BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
    `);
    
    // Add assigned_volunteer_id to donations if not exists
    await client.query(`
      ALTER TABLE public.donations 
      ADD COLUMN IF NOT EXISTS assigned_volunteer_id UUID REFERENCES public.ngo_volunteers(id) ON DELETE SET NULL;
    `);

    // We can also drop volunteers table or at least don't rely on it.
    // However, maybe it's better to just leave it and just use ngo_volunteers.

    console.log("Database updated successfully");
  } catch (err) {
    console.error("Error updating database", err);
  } finally {
    await client.end();
  }
}
setup();
