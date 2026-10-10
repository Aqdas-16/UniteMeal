const { createClient } = require('@supabase/supabase-js');
async function main() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data, error } = await supabase.from('ngo_volunteers').insert({
        ngo_id: 'test_id',
        name: 'Test Vol',
        email: 'test@test.com'
    }).select().single();
    
    console.log("Anon Insert Error:", error);
}
main().catch(console.error);
