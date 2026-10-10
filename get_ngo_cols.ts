import { supabase } from './lib/supabase';
async function main() {
    const { data: cols, error } = await supabase.from('ngos').select('*').limit(1);
    console.log(cols, error);
}
main();
