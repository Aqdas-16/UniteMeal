import { supabase } from './lib/supabase';
async function main() {
    const { data, error } = await supabase.rpc('exec_sql', { query: "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS country text; ALTER TABLE donations ADD COLUMN IF NOT EXISTS pickup_latitude numeric, ADD COLUMN IF NOT EXISTS pickup_longitude numeric, ADD COLUMN IF NOT EXISTS restaurant_name text;" });
    console.log(data, error);
}
main();
