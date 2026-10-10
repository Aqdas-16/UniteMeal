import { supabase } from './lib/supabase';
async function main() {
    const { data, error } = await supabase.from('ngo_volunteers').select('email').limit(1);
    console.log(error);
}
main();
