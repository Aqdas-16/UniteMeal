import { supabase } from '@/lib/supabase';

export async function initDb() {
    const { data, error } = await supabase.rpc('execute_sql', { sql: `
        CREATE TABLE IF NOT EXISTS food_requests (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            donation_id TEXT NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
            restaurant_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            ngo_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            volunteer_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
            message TEXT,
            requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            accepted_at TIMESTAMP WITH TIME ZONE,
            completed_at TIMESTAMP WITH TIME ZONE
        );
    `});
    console.log("DB INIT RESULT:", error || data);
}
