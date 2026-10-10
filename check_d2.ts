import { supabase } from './lib/supabase';
async function main() {
    const { data: available, error } = await supabase.from('donations')
               .select('*, restaurants(*)')
               .limit(1);
    console.log(available, error);
}
main();
