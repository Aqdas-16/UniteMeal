const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();
async function run() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = createClient(supabaseUrl.startsWith('postgresql') ? 'https://jcpfgqlhirhcarroxfwx.supabase.co' : supabaseUrl, supabaseKey);
    const { error } = await supabaseAdmin.rpc('exec_sql', { query: `
        ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS ngo_rating INTEGER CHECK (ngo_rating >= 1 AND ngo_rating <= 5);
        ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS ngo_feedback TEXT;
    `});
    console.log(error);
}
run();
