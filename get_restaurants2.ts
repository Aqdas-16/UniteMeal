import { supabase } from './lib/supabase';
async function main() {
    const { error } = await supabase.from('restaurants').select('*').eq('id', '123');
    console.log(error);
}
main();
