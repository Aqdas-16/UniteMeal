require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
async function run() {
    const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    const { data: { session }, error: authErr } = await s.auth.signInWithPassword({ email: 'kauchaliaqdas@gmail.com', password: 'password123' });
    if (authErr) {
        console.error("Auth err", authErr);
        // Let's create an admin client and generate a link
        const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
        // We'll just run it as admin but that bypasses RLS
        return;
    }
    const { error } = await s.from('deliveries').insert({
        donation_id: '42350d39-94c5-44f7-b158-3a607df5b003',
        ngo_id: session.user.id,
        volunteer_id: 'ec086c07-c4cc-44af-baa7-00e228078b3c',
        status: 'assigned',
        pickup_otp: '1234',
        delivery_otp: '5678'
    });
    console.log("Insert result:", error);
}
run();
