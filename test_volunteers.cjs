const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env'});

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.rpc('apply_migration', { query: `
    ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
    ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'online' CHECK (availability IN ('online', 'offline', 'busy'));
    ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT true;
  ` });
  console.log("RPC Error:", error?.message);
}
test();
