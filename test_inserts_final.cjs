const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: process.env.VITE_SUPABASE_URL
  });
  await client.connect();
  
  const categories = [
    'Cooked', 'Produce', 'Packaged', 'Bakery', 'Dairy', 'Beverage', 
    'Frozen', 'Dry Goods', 'Fruits', 'Vegetables', 'Snacks', 'Other'
  ];
  
  let success = 0;
  for (const cat of categories) {
    try {
      const res = await client.query(`
        INSERT INTO donations (
          donor_id, title, food_category, quantity_kg, estimated_meals, expiry_time, pickup_address, pickup_lat, pickup_lng
        ) VALUES (
          '281b333c-3a3d-4c3e-8c6f-bd3c990ccff7', -- some valid UUID or we can use generic one
          $1, $2, 5, 20, now() + interval '1 day', 'Test Addr', 0, 0
        ) RETURNING id
      `, ['Test ' + cat, cat]);
      console.log('SUCCESS:', cat);
      success++;
      await client.query(`DELETE FROM donations WHERE id = $1`, [res.rows[0].id]);
    } catch (e) {
      if (e.message.includes('insert or update on table "donations" violates foreign key constraint "donations_donor_id_fkey"')) {
         // donor_id constraint failed, this is fine, we just want to know if CHECK constraint failed.
         console.log('SUCCESS (Foreign Key Failed, but CHECK passed):', cat);
         success++;
      } else {
         console.log('FAILED:', cat, e.message);
      }
    }
  }
  await client.end();
}
test();
