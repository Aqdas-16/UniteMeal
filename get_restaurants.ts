import { supabase } from './lib/supabase';
async function main() {
    const { data, error } = await supabase.from('restaurants').select('*').limit(1);
    console.log(data, error);
}
main();
