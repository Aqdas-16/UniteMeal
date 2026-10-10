import { supabase } from './lib/supabase';
async function main() {
    const { data: available, error } = await supabase.from('donations')
               .select('*, profiles:donor_id(full_name, avatar_url, phone_number, address, latitude, longitude)')
               .limit(1);
    console.log("Count:", available?.length, error);
}
main();
