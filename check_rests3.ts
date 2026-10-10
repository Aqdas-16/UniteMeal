import { supabase } from './lib/supabase';
async function main() {
    const { data: rests, error } = await supabase.from('profiles').select('*').limit(3);
    console.log("Count:", rests?.length, error, rests?.map(r=>r.role));
}
main();
