import { supabase } from './lib/supabase';
async function main() {
    const { data: available, error } = await supabase.from('donations')
               .select('*, profiles!donations_restaurant_id_fkey(full_name, avatar_url, phone_number, address, latitude, longitude), donation_images(image_url)')
               .eq('status', 'available')
               .limit(1);
    console.log("Count:", available?.length, error);
}
main();
