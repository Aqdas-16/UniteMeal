import { supabase } from './lib/supabase';
async function main() {
    const { data: nData } = await supabase.from('profiles').select('*').eq('email', 'kauchaliaqdas@gmail.com').single();
    if (!nData) {
        console.log("No user found");
        return;
    }
    
    console.log("User:", nData);

    const updates = {
        organization_name: 'Aqdas kawchali',
        registration_number: '',
        mission_statement: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        location_lat: null,
        location_lng: null,
        operating_hours: '',
        capacity_people: null,
        storage_capacity_kg: null,
        updated_at: new Date().toISOString()
    };
    const { error: ngoError } = await supabase.from('ngos').upsert({ id: nData.id, ...updates });
    console.log("NGO Error:", ngoError);
    
    const { error: profError } = await supabase.from('profiles').update({
        full_name: 'Aqdas kawchali',
        phone_number: ''
    }).eq('id', nData.id);
    console.log("Prof Error:", profError);
}
main();
