const { Client } = require('pg');
async function run() {
  const client = new Client({
    connectionString: process.env.VITE_SUPABASE_URL || 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
  });
  await client.connect();
  
  const sql = `
    ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
    ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'online' CHECK (availability IN ('online', 'offline', 'busy'));
    ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT true;
    
    NOTIFY pgrst, 'reload schema';
  `;
  try {
    await client.query(sql);
    console.log("Columns added and schema cache reloaded");
  } catch(e) { console.error(e); }
  
  await client.end();
}
run();
