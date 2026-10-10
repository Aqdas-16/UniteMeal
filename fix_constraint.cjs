const { Client } = require('pg');

async function fix() {
  const client = new Client({
    connectionString: process.env.VITE_SUPABASE_URL
  });
  
  await client.connect();
  
  try {
    // 1. Drop existing constraint if it exists
    await client.query(`ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_food_category_check;`);
    console.log('Dropped donations_food_category_check');
    
    // 2. Add the new constraint with all categories
    await client.query(`
      ALTER TABLE donations ADD CONSTRAINT donations_food_category_check 
      CHECK (food_category IN (
        'Cooked', 'Produce', 'Packaged', 'Bakery', 'Dairy', 'Beverage', 
        'Frozen', 'Dry Goods', 'Fruits', 'Vegetables', 'Snacks', 'Other',
        'cooked_food', 'raw_ingredients', 'packaged_food', 'baked_goods', 'produce'
      ));
    `);
    console.log('Added new constraint');
    
    // While we're here, let's fix ngo_requests as well if it has it
    await client.query(`ALTER TABLE ngo_requests DROP CONSTRAINT IF EXISTS ngo_requests_food_category_check;`);
    await client.query(`
      ALTER TABLE ngo_requests ADD CONSTRAINT ngo_requests_food_category_check 
      CHECK (food_category IN (
        'Cooked', 'Produce', 'Packaged', 'Bakery', 'Dairy', 'Beverage', 
        'Frozen', 'Dry Goods', 'Fruits', 'Vegetables', 'Snacks', 'Other',
        'cooked_food', 'raw_ingredients', 'packaged_food', 'baked_goods', 'produce'
      ));
    `).catch(e => console.log('ngo_requests check failed, might not exist:', e.message));
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

fix();
