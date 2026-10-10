const { Client } = require('pg');
async function main() {
    const client = new Client({ connectionString: process.env.VITE_SUPABASE_URL });
    await client.connect();
    try {
        const res = await client.query("SELECT * FROM requests LIMIT 1;");
        console.table(res.rows);
    } catch(e) {
        console.log(e.message);
    }
    await client.end();
}
main().catch(console.error);
