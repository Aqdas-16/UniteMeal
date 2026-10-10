import { supabase } from './lib/supabase';
async function main() {
    const { data, error } = await supabase.from('ngo_team').select('*').limit(1);
    if (data && data.length > 0) console.log(Object.keys(data[0]));
    else console.log(data, error);
}
main();
