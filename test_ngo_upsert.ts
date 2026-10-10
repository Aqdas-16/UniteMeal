import { supabase } from './lib/supabase';
async function main() {
    const { data: { user } } = await supabase.auth.getUser();
    console.log("User:", user?.id);
    const updates = {
        organization_name: "Test NGO",
        registration_number: "12345",
        mission_statement: "Test",
        address: "123 Test St",
        city: "Test",
        state: "Test",
        zip_code: "12345",
        location_lat: 12.34,
        location_lng: 56.78,
        operating_hours: "9-5",
        capacity_people: 100,
        storage_capacity_kg: 50,
        updated_at: new Date().toISOString()
    };
    const { error: ngoError } = await supabase.from('ngos').upsert({ id: 'dc4iSmRwq5Y50AuR13fRwi2ptCr1', ...updates });
    console.log("Error:", ngoError);
}
main();
