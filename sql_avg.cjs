const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();
    await client.query(`
        CREATE OR REPLACE FUNCTION get_restaurant_rating(restaurant_uuid text)
        RETURNS numeric
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          avg_rating numeric;
        BEGIN
          SELECT avg(d.ngo_rating) INTO avg_rating
          FROM deliveries d
          JOIN donations dn ON d.donation_id = dn.id
          WHERE dn.donor_id = restaurant_uuid;
          RETURN COALESCE(avg_rating, 0);
        END;
        $$;
        
        CREATE OR REPLACE FUNCTION get_restaurant_rating_count(restaurant_uuid text)
        RETURNS integer
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          total integer;
        BEGIN
          SELECT count(d.ngo_rating) INTO total
          FROM deliveries d
          JOIN donations dn ON d.donation_id = dn.id
          WHERE dn.donor_id = restaurant_uuid;
          RETURN COALESCE(total, 0);
        END;
        $$;
        NOTIFY pgrst, 'reload schema';
    `);
    console.log("Done");
    await client.end();
}
run();
