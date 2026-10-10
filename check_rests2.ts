import { supabase } from './lib/supabase';
async function main() {
    const { data: rests, error } = await supabase.from('profiles').select('*, donations:donations!donations_restaurant_id_fkey(*)').eq('role', 'restaurant').limit(1);
    console.log("Count:", rests?.length, error);
}
main();
