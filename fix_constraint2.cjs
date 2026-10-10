const { Client } = require('pg');

async function fix() {
  const client = new Client({
    connectionString: process.env.VITE_SUPABASE_URL
  });
  
  await client.connect();
  
  try {
    await client.query(`ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_food_category_check;`);
    console.log('Dropped requests_food_category_check');
    
    await client.query(`
      ALTER TABLE requests ADD CONSTRAINT requests_food_category_check 
      CHECK (food_category IN (
        'Cooked', 'Produce', 'Packaged', 'Bakery', 'Dairy', 'Beverage', 
        'Frozen', 'Dry Goods', 'Fruits', 'Vegetables', 'Snacks', 'Other',
        'cooked_food', 'raw_ingredients', 'packaged_food', 'baked_goods', 'produce'
      ));
    `);
    console.log('Added new constraint to requests');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
fix();
