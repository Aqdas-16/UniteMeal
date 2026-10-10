const { createClient } = require('@supabase/supabase-js');
async function main() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    
    // insert a test row
    const { data: inserted, error: insertError } = await supabase.from('ngo_volunteers').insert({
        ngo_id: 'test_id',
        name: 'Test Vol Update',
        email: 'test@test.com'
    }).select().single();
    
    if (insertError) {
        console.log("Insert Error:", insertError);
        return;
    }
    
    // update the test row
    const { data: updated, error: updateError } = await supabase.from('ngo_volunteers').update({
        name: 'Updated Vol'
    }).eq('id', inserted.id).select().single();
    
    console.log("Update Error:", updateError);
    console.log("Updated Data:", updated?.name);
    
    // delete the test row
    const { error: deleteError } = await supabase.from('ngo_volunteers').delete().eq('id', inserted.id);
    console.log("Delete Error:", deleteError);
}
main().catch(console.error);
