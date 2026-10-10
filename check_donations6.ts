import { supabase } from './lib/supabase';
async function main() {
    const { data: available, error } = await supabase.from('donations')
               .select('*, profiles(*)')
               .limit(1);
    console.log("Count:", available?.length, error);
}
main();
