const { Client } = require('pg');
async function run() {
  const client = new Client({
    connectionString: process.env.VITE_SUPABASE_URL || 'postgresql://postgres.jcpfgqlhirhcarroxfwx:safashifa1609@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
  });
  await client.connect();
  
  const sql = `
    CREATE OR REPLACE FUNCTION verify_pickup_otp(p_delivery_id TEXT, p_otp TEXT)
    RETURNS BOOLEAN AS $$
    DECLARE
      v_otp TEXT;
    BEGIN
      SELECT pickup_otp INTO v_otp FROM deliveries WHERE id = p_delivery_id AND volunteer_id = auth.uid()::text;
      IF v_otp = p_otp THEN
        RETURN TRUE;
      ELSE
        RETURN FALSE;
      END IF;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    CREATE OR REPLACE FUNCTION verify_delivery_otp(p_delivery_id TEXT, p_otp TEXT)
    RETURNS BOOLEAN AS $$
    DECLARE
      v_otp TEXT;
    BEGIN
      SELECT delivery_otp INTO v_otp FROM deliveries WHERE id = p_delivery_id AND volunteer_id = auth.uid()::text;
      IF v_otp = p_otp THEN
        -- Also update status to completed to ensure atomicity
        UPDATE deliveries SET status = 'completed', completed_at = now() WHERE id = p_delivery_id;
        UPDATE volunteers SET availability = 'online' WHERE id = auth.uid()::text;
        RETURN TRUE;
      ELSE
        RETURN FALSE;
      END IF;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  try {
    await client.query(sql);
    console.log("RPCs created");
  } catch(e) { console.error(e); }
  
  await client.end();
}
run();
