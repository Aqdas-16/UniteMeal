const { Client } = require('pg');
const connectionString = process.env.VITE_SUPABASE_URL;

async function run() {
    const client = new Client({ connectionString });
    await client.connect();
    
    try { await client.query(`ALTER TABLE donations ADD COLUMN restaurant_id TEXT REFERENCES profiles(id) ON DELETE CASCADE;`); } catch(e) {}
    try { await client.query(`ALTER TABLE donations ADD COLUMN food_name TEXT;`); } catch(e) {}
    try { await client.query(`ALTER TABLE donations ADD COLUMN quantity NUMERIC;`); } catch(e) {}
    try { await client.query(`ALTER TABLE donations ADD COLUMN category TEXT;`); } catch(e) {}
    try { await client.query(`ALTER TABLE donations ADD COLUMN veg_type TEXT;`); } catch(e) {}

    console.log("Updated donations table");
    await client.end();
}
run();
