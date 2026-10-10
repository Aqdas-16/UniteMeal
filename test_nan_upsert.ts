import { supabase } from './lib/supabase';
async function main() {
    const { data: nData } = await supabase.from('profiles').select('*').eq('email', 'kauchaliaqdas@gmail.com').single();
    if (!nData) return;

    const updates = {
        organization_name: 'Aqdas kawchali',
        capacity_people: parseInt(""),
        updated_at: new Date().toISOString()
    };
    const { error: ngoError } = await supabase.from('ngos').upsert({ id: nData.id, ...updates });
    console.log("NGO Error:", ngoError);
}
main();
