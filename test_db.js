import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('donations').select('*');
  console.log('Error:', error);
  console.log('Donations count:', data?.length);
  if (data?.length > 0) {
     console.log('Statuses:', data.map(d => d.status));
     console.log('IDs:', data.map(d => d.id));
  }
}
run();
