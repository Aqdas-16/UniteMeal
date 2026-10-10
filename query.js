const { Client } = require('pg');

async function main() {
    const client = new Client({ connectionString: process.env.VITE_SUPABASE_URL });
    await client.connect();
    try {
        const res = await client.query("SELECT conname, pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE conrelid = 'delivery_tracking'::regclass AND contype = 'f';");
        console.table(res.rows);
    } catch(e) {
        console.log(e.message);
    }
    await client.end();
}
main().catch(console.error);
