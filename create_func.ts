import { supabase } from './lib/supabase';
async function main() {
  const sql = `
CREATE OR REPLACE FUNCTION accept_pickup(
    p_donation_id UUID,
    p_ngo_id UUID,
    p_volunteer_id UUID,
    p_restaurant_id UUID,
    p_ngo_name TEXT
) RETURNS void AS $$
BEGIN
    UPDATE donations 
    SET status = 'accepted', 
        updated_at = NOW(),
        assigned_volunteer_id = p_volunteer_id
    WHERE id = p_donation_id AND status = 'available';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Donation is no longer available';
    END IF;

    INSERT INTO pickup_tasks (
        donation_id, restaurant_id, ngo_id, team_member_id, status, created_at
    ) VALUES (
        p_donation_id, p_restaurant_id, p_ngo_id, p_volunteer_id, 'assigned', NOW()
    );

    INSERT INTO deliveries (
        donation_id, ngo_id, volunteer_id, status, created_at
    ) VALUES (
        p_donation_id, p_ngo_id, p_volunteer_id, 'accepted', NOW()
    );

    INSERT INTO notifications (
        user_id, title, message, type, related_entity_id, related_entity_type
    ) VALUES 
    (p_restaurant_id, 'Donation Accepted', p_ngo_name || ' has accepted your donation and assigned a driver.', 'delivery_update', p_donation_id, 'donation'),
    (p_volunteer_id, 'New Pickup Assigned', 'You have been assigned to pick up a donation.', 'delivery_update', p_donation_id, 'donation');
END;
$$ LANGUAGE plpgsql;
`;
  const { error } = await supabase.rpc('execute_sql', { sql });
  console.log(error || 'Success');
}
main();
