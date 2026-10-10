import { supabase } from './lib/supabase';
async function main() {
    const { data: r } = await supabase.from('restaurants').select('*').limit(1);
    console.log(r);
}
main();
