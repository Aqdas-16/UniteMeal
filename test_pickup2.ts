import { supabase } from './lib/supabase';
async function main() {
    const { data: myTasks, error } = await supabase.from('pickup_tasks')
          .select('*, donations(quantity_kg, estimated_meals), profiles!pickup_tasks_restaurant_id_fkey(*)')
          .limit(1);
    console.log("Count:", myTasks?.length, error);
}
main();
