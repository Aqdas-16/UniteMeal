import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("No Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing insert...");
  const { data, error } = await supabase.from('profiles').insert({
    id: 'test-user-1234',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'donor',
    account_status: 'active'
  });
  console.log("Insert error:", error);
  
  console.log("Testing fetch donations...");
  const { data: d, error: e } = await supabase.from('donations').select('*').limit(1);
  console.log("Donations error:", e);
}

test();
