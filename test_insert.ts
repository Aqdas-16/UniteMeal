import { supabase } from './lib/supabase';
async function main() {
    // Find an NGO ID
    const { data: ngos } = await supabase.from('ngos').select('id').limit(1);
    if (!ngos || ngos.length === 0) return console.log("No NGOs");
    const ngo_id = ngos[0].id;
    
    const { data, error } = await supabase.from('ngo_volunteers').insert({
        ngo_id, name: 'Test Vol', phone: '1234567890', availability: 'full-time', status: 'available'
    }).select('*');
    console.log("Insert result:", data, error);
}
main();
