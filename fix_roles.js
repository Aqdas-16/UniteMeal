import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const realUrl = supabaseUrl.startsWith('postgresql') ? 'https://jcpfgqlhirhcarroxfwx.supabase.co' : supabaseUrl;
const supabaseAdmin = createClient(realUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function check() {
    const { data: donors } = await supabaseAdmin.from('donors').select('*').eq('id', 'Y8mwWhSj2rYQzrEWNUL4zgwUJOM2');
    console.log("donors Y8:", JSON.stringify(donors));
    const { data: rests } = await supabaseAdmin.from('restaurants').select('*').eq('user_id', 'Y8mwWhSj2rYQzrEWNUL4zgwUJOM2');
    console.log("restaurants Y8:", JSON.stringify(rests));
    
    // Also check GvGYpHmsJGXtAw38YMhCntqTkVC2
    const { data: donorsG } = await supabaseAdmin.from('donors').select('*').eq('id', 'GvGYpHmsJGXtAw38YMhCntqTkVC2');
    console.log("donors Gv:", JSON.stringify(donorsG));
    const { data: restsG } = await supabaseAdmin.from('restaurants').select('*').eq('user_id', 'GvGYpHmsJGXtAw38YMhCntqTkVC2');
    console.log("restaurants Gv:", JSON.stringify(restsG));
}
check();
