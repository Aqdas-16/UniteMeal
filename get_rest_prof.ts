import { supabase } from './lib/supabase';
async function main() {
    const { data, error } = await supabase.from('restaurant_profiles').select('*').limit(1);
    console.log(data, error);
}
main();
