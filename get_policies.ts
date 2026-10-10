import { supabase } from './lib/supabase';
async function main() {
    const { data, error } = await supabase.rpc('get_policies');
    console.log(data, error);
}
main();
