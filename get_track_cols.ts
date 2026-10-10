import { supabase } from './lib/supabase';
async function main() {
    const { data, error } = await supabase.rpc('execute_sql', { sql: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'tracking_locations'
    ` });
    console.log(data || error);
}
main();
