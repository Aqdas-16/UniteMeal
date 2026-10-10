import { supabase } from './lib/supabase';
async function main() {
    const { data: available, error } = await supabase.from('donations')
               .select('*, restaurants(business_name, latitude, longitude, address, phone)')
               .limit(1);
    console.log("Count:", available, error);
}
main();
