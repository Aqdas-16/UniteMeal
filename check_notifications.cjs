const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function run() {
    const client = new Client({
        connectionString: process.env.VITE_SUPABASE_URL || 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
    });
    await client.connect();
    
    try {
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'notifications';
        `);
        console.log("Notifications columns:", res.rows);
        
        const res2 = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'audit_logs';
        `);
        console.log("Audit Logs columns:", res2.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
