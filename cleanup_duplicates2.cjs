require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Fetching all restaurants...");
    const { data: restaurants, error } = await supabase.from('restaurants').select('*');
    if (error) {
        console.error("Error fetching restaurants", error);
        return;
    }

    const byUser = {};
    for (const r of restaurants) {
        if (!byUser[r.user_id]) byUser[r.user_id] = [];
        byUser[r.user_id].push(r);
    }

    for (const uid in byUser) {
        const userRests = byUser[uid];
        if (userRests.length > 1) {
            console.log(`Found ${userRests.length} duplicates for user ${uid}`);
            
            userRests.sort((a, b) => {
                const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
                const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
                return dateB - dateA;
            });

            const keep = userRests[0];
            const remove = userRests.slice(1);

            let needsUpdate = false;
            for (const r of remove) {
                for (const key in r) {
                    if (r[key] && !keep[key]) {
                        keep[key] = r[key];
                        needsUpdate = true;
                    }
                }
            }

            if (needsUpdate) {
                console.log(`Updating main record ${keep.restaurant_id}`);
                const { restaurant_id, created_at, updated_at, ...updates } = keep;
                await supabase.from('restaurants').update(updates).eq('restaurant_id', keep.restaurant_id);
            }

            for (const r of remove) {
                console.log(`Deleting duplicate record ${r.restaurant_id}`);
                await supabase.from('restaurants').delete().eq('restaurant_id', r.restaurant_id);
            }
        }
    }
    console.log("Cleanup complete.");
}
run();
