const { Client } = require('pg');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

async function run() {
    const client = new Client({
        connectionString: process.env.VITE_SUPABASE_URL || 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
    });
    
    await client.connect();
    
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS food_requests (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                donation_id TEXT NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
                restaurant_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                ngo_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                volunteer_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
                status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
                message TEXT,
                requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
                accepted_at TIMESTAMP WITH TIME ZONE,
                completed_at TIMESTAMP WITH TIME ZONE
            );
            CREATE INDEX IF NOT EXISTS idx_food_requests_restaurant_id ON food_requests(restaurant_id);
            CREATE INDEX IF NOT EXISTS idx_food_requests_ngo_id ON food_requests(ngo_id);
            CREATE INDEX IF NOT EXISTS idx_food_requests_donation_id ON food_requests(donation_id);
        `);
        console.log("Table created successfully!");
    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        await client.end();
    }
}
run();
