const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();
    
    const tables = ['tracking_locations', 'ngo_team', 'delivery_locations', 'food_requests'];
    
    for (const t of tables) {
        try {
            await client.query(`ALTER TABLE ${t} DISABLE ROW LEVEL SECURITY;`);
            console.log("RLS disabled on", t);
        } catch (e) {
            console.error("Error on", t, e.message);
        }
    }
    await client.end();
}
run();
