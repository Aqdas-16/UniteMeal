import { supabase } from './lib/supabase';
async function main() {
    const { data, error } = await supabase.from('pickup_tasks').select('*').limit(1);
    if (data) console.log(Object.keys(data[0]));
    else console.error(error);
}
main();
