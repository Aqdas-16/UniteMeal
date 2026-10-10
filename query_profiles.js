import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const realUrl = supabaseUrl.startsWith('postgresql') ? 'https://jcpfgqlhirhcarroxfwx.supabase.co' : supabaseUrl;
const supabaseAdmin = createClient(realUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function check() {
    const { data: profiles, error } = await supabaseAdmin.from('profiles').select('*').eq('role', 'ngo');
    console.log("Profiles:", JSON.stringify(profiles, null, 2));
    
    const { data: ngos } = await supabaseAdmin.from('ngos').select('*');
    console.log("NGOs:", JSON.stringify(ngos, null, 2));
}
check();
