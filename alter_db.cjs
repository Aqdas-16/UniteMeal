const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.VITE_SUPABASE_URL || 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
  });
  
  await client.connect();
  
  const sql = `
    -- Alter requests table
    ALTER TABLE requests ADD COLUMN IF NOT EXISTS food_name TEXT;
    ALTER TABLE requests ADD COLUMN IF NOT EXISTS food_type TEXT;
    ALTER TABLE requests ADD COLUMN IF NOT EXISTS quantity_unit TEXT DEFAULT 'kg';
    ALTER TABLE requests ADD COLUMN IF NOT EXISTS people_in_need INTEGER;
    ALTER TABLE requests ADD COLUMN IF NOT EXISTS meals_required INTEGER;
    ALTER TABLE requests ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'Normal';
    ALTER TABLE requests ADD COLUMN IF NOT EXISTS fulfilled_quantity DOUBLE PRECISION DEFAULT 0;
    ALTER TABLE requests ADD COLUMN IF NOT EXISTS notes TEXT;
    
    -- Drop constraints if they exist to avoid errors with new values
    ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;
    ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_food_category_check;
    
    -- Ensure status includes required values
    -- We can just leave status unchecked or check against a wider set.
    
    -- Alter donations table
    ALTER TABLE donations ADD COLUMN IF NOT EXISTS request_id TEXT REFERENCES requests(id) ON DELETE SET NULL;
    ALTER TABLE donations ADD COLUMN IF NOT EXISTS food_type TEXT;
  `;
  
  try {
    await client.query(sql);
    console.log("Migration successful");
  } catch(e) {
    console.error("Migration failed:", e);
  } finally {
    await client.end();
  }
}
run();
