import { supabase } from './lib/supabase';
async function main() {
    const { data } = await supabase.from('profiles').select('*').limit(1);
    if (data) console.log(Object.keys(data[0]));
}
main();
