import { supabase } from './lib/supabase';
async function main() {
    const { data: available, error } = await supabase.from('donations')
               .select('*, profiles:donor_id(restaurant_name, avatar_url, phone, full_name, business_name, name, location_lat, location_lng, address), donation_images(image_url)')
               .eq('status', 'available')
               .gt('expiry_time', new Date().toISOString())
               .order('created_at', { ascending: false });
    console.log("Count:", available?.length);
    if (error) console.error(error);
}
main();
