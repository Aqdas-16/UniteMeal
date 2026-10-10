const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const res = await supabase.from('pickup_tasks').select('*').limit(1);
    console.log(res.error || res.data);
}
run();
