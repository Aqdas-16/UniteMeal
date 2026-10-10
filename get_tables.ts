import { supabase } from './lib/supabase';
async function main() {
    const { data: teamCols, error: err1 } = await supabase.from('ngo_team').select().limit(0);
    const { data: volCols, error: err2 } = await supabase.from('ngo_volunteers').select().limit(0);
    console.log("Team:", err1);
    console.log("Vols:", err2);
}
main();
