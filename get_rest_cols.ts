import { supabase } from './lib/supabase';
async function main() {
    const { data: cols } = await supabase.from('restaurants').select('*').limit(1);
    console.log(cols);
}
main();
