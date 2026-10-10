const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();
    
    await client.query(`
        CREATE OR REPLACE FUNCTION public.verify_pickup_otp(p_delivery_id text, p_otp text)
        RETURNS boolean
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $function$
        DECLARE
          v_otp TEXT;
        BEGIN
          SELECT pickup_otp INTO v_otp FROM deliveries WHERE id = p_delivery_id;
          IF v_otp = p_otp THEN
            RETURN TRUE;
          ELSE
            RETURN FALSE;
          END IF;
        END;
        $function$
    `);
    
    await client.query(`
        CREATE OR REPLACE FUNCTION public.verify_delivery_otp(p_delivery_id text, p_otp text)
        RETURNS boolean
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $function$
        DECLARE
          v_otp TEXT;
          v_volunteer_id TEXT;
        BEGIN
          SELECT delivery_otp, volunteer_id INTO v_otp, v_volunteer_id FROM deliveries WHERE id = p_delivery_id;
          IF v_otp = p_otp THEN
            -- Also update status to completed to ensure atomicity
            UPDATE deliveries SET status = 'completed', completed_at = now() WHERE id = p_delivery_id;
            UPDATE volunteers SET availability = 'online' WHERE id = v_volunteer_id;
            RETURN TRUE;
          ELSE
            RETURN FALSE;
          END IF;
        END;
        $function$
    `);
    
    console.log("RPCs updated successfully!");
    
    // Also verify schema cache reload
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    await client.end();
}
run();
