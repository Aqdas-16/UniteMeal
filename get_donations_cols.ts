import { supabase } from './lib/supabase';
async function main() {
    const { data: cols } = await supabase.from('donations').select('*').limit(1);
    console.log(cols);
}
main();
