import { supabase } from './lib/supabase';
async function main() {
    const { data: available, error } = await supabase.from('donations')
               .select('*, profiles!donations_restaurant_id_fkey(*)')
               .limit(1);
    console.log("Count:", available?.length, error);
}
main();
