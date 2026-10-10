const { Client } = require('pg');

async function main() {
    const client = new Client({ connectionString: process.env.VITE_SUPABASE_URL });
    await client.connect();
    try {
        // Map old values to new ones in 'donations' table
        const mappings = {
            'cooked_food': 'Cooked',
            'raw_ingredients': 'Produce',
            'packaged_food': 'Packaged',
            'baked_goods': 'Bakery',
            'produce': 'Produce'
        };

        // First, drop the check constraint
        await client.query(`ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_food_category_check;`);
        console.log("Dropped constraint");

        // Update rows
        const res = await client.query(`SELECT id, food_category FROM donations`);
        for (let row of res.rows) {
            let cat = row.food_category;
            let newCat = mappings[cat];
            if (!newCat) {
                // If not in mappings, try to normalize
                let lc = (cat || '').toLowerCase();
                if (lc.includes('cook')) newCat = 'Cooked';
                else if (lc.includes('prod') || lc.includes('raw')) newCat = 'Produce';
                else if (lc.includes('pack')) newCat = 'Packaged';
                else if (lc.includes('bake')) newCat = 'Bakery';
                else if (lc.includes('dairy')) newCat = 'Dairy';
                else if (lc.includes('bev')) newCat = 'Beverage';
                else newCat = 'Other';
            }
            await client.query(`UPDATE donations SET food_category = $1 WHERE id = $2`, [newCat, row.id]);
        }
        console.log("Updated existing rows in donations");

        // Now do the same for food_requests if they use the same
        try {
            await client.query(`ALTER TABLE food_requests DROP CONSTRAINT IF EXISTS food_requests_food_category_check;`);
            console.log("Dropped constraint on food_requests");
            const res2 = await client.query(`SELECT id, food_category FROM food_requests`);
            for (let row of res2.rows) {
                let cat = row.food_category;
                let newCat = mappings[cat];
                if (!newCat) {
                    let lc = (cat || '').toLowerCase();
                    if (lc.includes('cook')) newCat = 'Cooked';
                    else if (lc.includes('prod') || lc.includes('raw')) newCat = 'Produce';
                    else if (lc.includes('pack')) newCat = 'Packaged';
                    else if (lc.includes('bake')) newCat = 'Bakery';
                    else if (lc.includes('dairy')) newCat = 'Dairy';
                    else if (lc.includes('bev')) newCat = 'Beverage';
                    else newCat = 'Other';
                }
                await client.query(`UPDATE food_requests SET food_category = $1 WHERE id = $2`, [newCat, row.id]);
            }
        } catch(e) {}

        // Add new check constraint
        const allowed = [
            'Cooked', 'Produce', 'Packaged', 'Bakery', 'Dairy', 'Beverage', 
            'Frozen', 'Dry Goods', 'Fruits', 'Vegetables', 'Snacks', 'Other'
        ];
        const allowedStr = allowed.map(c => `'${c}'`).join(', ');

        await client.query(`
            ALTER TABLE donations 
            ADD CONSTRAINT donations_food_category_check 
            CHECK (food_category IN (${allowedStr}));
        `);
        console.log("Added new constraint to donations");

        try {
            await client.query(`
                ALTER TABLE food_requests 
                ADD CONSTRAINT food_requests_food_category_check 
                CHECK (food_category IN (${allowedStr}));
            `);
            console.log("Added new constraint to food_requests");
        } catch(e) {}

    } catch(e) {
        console.error(e);
    }
    await client.end();
}
main().catch(console.error);
