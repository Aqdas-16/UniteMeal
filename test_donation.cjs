const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// Oh wait, VITE_SUPABASE_URL in .env is a pg connection string!
// Let me use SUPABASE_URL from env
