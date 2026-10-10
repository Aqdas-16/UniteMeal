import { supabase } from './lib/supabase';
async function main() {
    const { data: insertData, error: insertErr } = await supabase.from('ngo_volunteers').insert({ ngo_id: 'test', name: 'Test' }).select().single();
    if (insertData) {
        console.log("Columns:", Object.keys(insertData));
        await supabase.from('ngo_volunteers').delete().eq('id', insertData.id);
    } else {
        console.log("Insert Error:", insertErr);
    }
}
main();
