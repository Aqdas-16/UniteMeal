const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();
    const res = await client.query(`
        SELECT polname, polcmd, polqual, polwithcheck
        FROM pg_policy
        WHERE polrelid = 'deliveries'::regclass
    `);
    
    for (const r of res.rows) {
        console.log(r.polname, r.polcmd);
        const expr = await client.query(`SELECT pg_get_expr($1, 'deliveries'::regclass)`, [r.polqual]);
        console.log("  Qual:", expr.rows[0].pg_get_expr);
        if (r.polwithcheck) {
            const check = await client.query(`SELECT pg_get_expr($1, 'deliveries'::regclass)`, [r.polwithcheck]);
            console.log("  Check:", check.rows[0].pg_get_expr);
        } else {
            console.log("  Check: (same as qual)");
        }
    }
    
    await client.end();
}
run();
