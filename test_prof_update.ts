import { supabase } from './lib/supabase';
async function main() {
    const { error: profError } = await supabase.from('profiles').update({
        full_name: "Test NGO",
        phone_number: "1234567890"
    }).eq('id', 'dc4iSmRwq5Y50AuR13fRwi2ptCr1');
    console.log("Error:", profError);
}
main();
