import { supabase } from './lib/supabase';
async function main() {
    const { data: nData } = await supabase.from('profiles').select('*').eq('email', 'kauchaliaqdas@gmail.com').single();
    console.log("Before Update:", nData?.organization_name);

    const { data, error } = await supabase.from('ngos').update({ organization_name: 'Test 2' }).eq('id', nData.id).select();
    console.log("Updated Data:", data);
    console.log("Error:", error);
}
main();
