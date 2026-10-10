const { Client } = require('pg');
async function main() {
    const client = new Client({ connectionString: process.env.VITE_SUPABASE_URL });
    await client.connect();
    
    await client.query(`
        CREATE OR REPLACE FUNCTION tr_set_ngo_volunteers_ngo_id()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.ngo_id IS NULL AND auth.uid() IS NOT NULL THEN
                NEW.ngo_id := auth.uid()::text;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    await client.query(`
        DROP TRIGGER IF EXISTS set_ngo_id_before_insert ON ngo_volunteers;
        CREATE TRIGGER set_ngo_id_before_insert
        BEFORE INSERT ON ngo_volunteers
        FOR EACH ROW
        EXECUTE FUNCTION tr_set_ngo_volunteers_ngo_id();
    `);

    console.log("Trigger created for ngo_volunteers");
    await client.end();
}
main().catch(console.error);
