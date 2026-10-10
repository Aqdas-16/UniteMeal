import { supabase } from './lib/supabase';
async function main() {
    const { data, error } = await supabase.from('pickup_tasks').select('id').limit(1);
    console.log("pickup_tasks exists:", !error || error.code !== '42P01');
    const { data: vData, error: vErr } = await supabase.from('ngo_volunteers').select('id').limit(1);
    console.log("ngo_volunteers exists:", !vErr || vErr.code !== '42P01');
    const { data: tData, error: tErr } = await supabase.from('tracking_locations').select('id').limit(1);
    console.log("tracking_locations exists:", !tErr || tErr.code !== '42P01');
    if (tErr) console.log(tErr);
}
main();
