import { supabase } from './lib/supabase';
async function main() {
    const { data: nData } = await supabase.from('profiles').select('*').eq('role', 'ngo').limit(1);
    console.log("NGO:", nData);
}
main();
