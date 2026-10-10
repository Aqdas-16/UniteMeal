import { supabase } from './lib/supabase';
async function main() {
    const { data: available, error } = await supabase.from('donations')
               .select('id, status, expiry_time')
               .limit(10);
    console.log(available, error);
}
main();
