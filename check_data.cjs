const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();
    const res = await client.query(`
        SELECT id, address, latitude, longitude
        FROM profiles LIMIT 5
    `);
    console.log("PROFILES:");
    console.log(res.rows);
    
    const res2 = await client.query(`
        SELECT id, address, location_lat, location_lng
        FROM ngos LIMIT 5
    `);
    console.log("NGOS:");
    console.log(res2.rows);
    await client.end();
}
run();
