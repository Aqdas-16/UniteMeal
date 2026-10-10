const { Client } = require('pg');
async function main() {
    const client = new Client({ connectionString: process.env.VITE_SUPABASE_URL });
    await client.connect();
    try {
        await client.query(`ALTER TABLE profiles ADD COLUMN fcm_token text;`);
        console.log("Added fcm_token to profiles");
    } catch(e) {
        console.log(e.message);
    }
    await client.end();
}
main().catch(console.error);
