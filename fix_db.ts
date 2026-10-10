import { supabase } from './lib/supabase';
async function main() {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const { data, error } = await supabase.from('donations')
        .update({ expiry_time: futureDate.toISOString() })
        .eq('status', 'available');
    console.log(data, error);
}
main();
