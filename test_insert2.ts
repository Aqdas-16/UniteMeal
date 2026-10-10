import { supabase } from './lib/supabase';
async function main() {
    const { data: ngos } = await supabase.from('ngos').select('id').limit(1);
    const ngo_id = ngos[0].id;
    
    const { data, error } = await supabase.from('ngo_volunteers').insert({
        ngo_id, name: 'Test Vol', phone: '1234567890', availability: true, status: 'available'
    }).select('*');
    console.log("Insert result:", data, error);
}
main();
