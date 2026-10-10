import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const realUrl = supabaseUrl.startsWith('postgresql') ? 'https://jcpfgqlhirhcarroxfwx.supabase.co' : supabaseUrl;
const supabaseAdmin = createClient(realUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function check() {
    const { data: donations, error } = await supabaseAdmin.from('donations').select('id, title, status, ngo:profiles!donations_ngo_id_fkey(full_name), deliveries(id, status)').limit(1);
    console.log(JSON.stringify(donations, null, 2));
    console.log(error);
}
check();
