import { supabase } from './lib/supabase';
async function main() {
    const { data: available, error } = await supabase.from('donations')
               .select('*, restaurants!donations_restaurant_id_fkey(*)')
               .eq('status', 'available')
               .limit(1);
    console.log(available, error);
}
main();
