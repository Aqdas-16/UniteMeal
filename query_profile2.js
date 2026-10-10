import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const realUrl = supabaseUrl.startsWith('postgresql') ? 'https://jcpfgqlhirhcarroxfwx.supabase.co' : supabaseUrl;
const supabaseAdmin = createClient(realUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function check() {
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', 'Y8mwWhSj2rYQzrEWNUL4zgwUJOM2');
    console.log("Profile Y8mwWhSj2rYQzrEWNUL4zgwUJOM2:", JSON.stringify(profile, null, 2));
}
check();
