import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
    const { data: cols } = await supabase.rpc('query_schema', {
      sql_statement: "SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'delivery_tracking';"
    });
    console.log(cols);
}
test();
