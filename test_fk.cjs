const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();
    // Drop constraint and recreate to allow null
    try {
        await client.query(`
            ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_performed_by_fkey;
            ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES profiles(id) ON DELETE SET NULL;
        `);
        console.log("FK updated");
    } catch(err) {
        console.log("Error:", err.message);
    }
    await client.end();
}
run();
