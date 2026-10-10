import { createClient } from '@supabase/supabase-js';
async function main() {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY, // anon if service role not set
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data, error } = await supabase.from('ngo_volunteers').select('*').limit(1);
    console.log("Cols:", data ? (data[0] ? Object.keys(data[0]) : "Empty table") : error);
    
    // Also let's just insert one to see the columns
    const { data: d2, error: e2 } = await supabase.from('ngo_volunteers').insert({ngo_id: 'test', name: 't', phone: '12'}).select().single();
    console.log("Insert:", e2);
}
main();
