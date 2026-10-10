const { Client } = require('pg');

async function main() {
    const client = new Client({ connectionString: process.env.VITE_SUPABASE_URL });
    await client.connect();
    try {
        const allowed = [
            'Cooked', 'Produce', 'Packaged', 'Bakery', 'Dairy', 'Beverage', 
            'Frozen', 'Dry Goods', 'Fruits', 'Vegetables', 'Snacks', 'Other'
        ];
        
        let profileRes = await client.query("SELECT id FROM profiles WHERE role = 'restaurant' LIMIT 1;");
        let profileId = profileRes.rows[0]?.id || '00000000-0000-0000-0000-000000000000';
        
        for (let cat of allowed) {
            try {
                let expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                await client.query(`
                    INSERT INTO donations (title, food_category, quantity_kg, estimated_meals, status, donor_id, expiry_time)
                    VALUES ($1, $2, 1, 1, 'available', $3, $4)
                    RETURNING id;
                `, ['Test ' + cat, cat, profileId, expiry]);
                console.log("Success: " + cat);
            } catch(e) {
                console.log("Failed: " + cat + " - " + e.message);
            }
        }
    } catch(e) {
        console.error(e);
    }
    await client.end();
}
main().catch(console.error);
