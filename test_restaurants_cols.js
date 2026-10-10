import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('restaurants').select('*').limit(1);
  console.log("Restaurants data:", data);
  console.log("Restaurants error:", error);
}
test();
