import { supabase } from './lib/supabase';
async function main() {
    const { data: rest } = await supabase.from('restaurants').select('*').limit(1);
    if (rest && rest.length > 0) console.log('restaurants', Object.keys(rest[0]));
    const { data: ngo } = await supabase.from('ngos').select('*').limit(1);
    if (ngo && ngo.length > 0) console.log('ngos', Object.keys(ngo[0]));
}
main();
