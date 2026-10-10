import { supabase } from './lib/supabase';
async function main() {
    const { data: team, error: err1 } = await supabase.from('ngo_team').insert({ ngo_id: 'test', name: 'Test', email: 'test@test.com' }).select().single();
    console.log("Team Insert Error:", err1);
}
main();
