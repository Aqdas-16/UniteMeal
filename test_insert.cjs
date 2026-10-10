require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
async function run() {
    const url = process.env.VITE_SUPABASE_URL || 'https://jcpfgqlhirhcarroxfwx.supabase.co';
    const s = createClient(url, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
    // Let's manually run the query with RLS disabled just to check constraints
    const { error } = await s.from('deliveries').insert({
        donation_id: '42350d39-94c5-44f7-b158-3a607df5b003',
        ngo_id: 'GvGYpHmsJGXtAw38YMhCntqTkVC2',
        volunteer_id: 'ec086c07-c4cc-44af-baa7-00e228078b3c',
        status: 'assigned',
        pickup_otp: '1234',
        delivery_otp: '5678'
    });
    console.log("Admin insert result:", error);
}
run();
