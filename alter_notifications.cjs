const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function run() {
    const client = new Client({
        connectionString: process.env.VITE_SUPABASE_URL || 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
    });
    await client.connect();
    
    try {
        await client.query(`
            ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
            ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_related_entity_type_check;
            
            ALTER TABLE notifications 
            ADD COLUMN IF NOT EXISTS created_by TEXT,
            ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'low',
            ADD COLUMN IF NOT EXISTS action_url TEXT,
            ADD COLUMN IF NOT EXISTS metadata JSONB;
            
            ALTER TABLE audit_logs ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
        `);
        console.log("Table altered successfully!");
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
