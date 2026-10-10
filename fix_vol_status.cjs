const fs = require('fs');

let code = fs.readFileSync('src/pages/VolunteerPortal.tsx', 'utf8');

const fetchMethod = `  const fetchActiveDelivery = async () => {
    if (!user) return;
    try {
      // Find the active delivery for this volunteer
      const { data, error } = await supabase
        .from('deliveries')
        .select(\`
          *,
          donations(*),
          ngos:profiles!ngo_id(*)
        \`)
        .eq('volunteer_id', user.uid)
        .in('status', ['assigned', 'accepted', 'heading_to_restaurant', 'arrived_restaurant', 'picked_up', 'heading_to_ngo', 'arrived_ngo'])
        .maybeSingle();
        
      if (error && error.code !== "PGRST116") console.error(error);
      
      // Update Volunteer Availability Status
      const currentAvailability = data ? 'busy' : 'online'; // online means available for tasks
      await supabase.from('volunteers').update({ availability: currentAvailability }).eq('id', user.uid);
      
      if (data) {
        setActiveDelivery(data);
        setNgo(data.ngos);
        
        // Fetch restaurant
        const { data: restData } = await supabase.from('profiles').select('*').eq('id', data.donations.donor_id).maybeSingle();
        setRestaurant(restData);
        
      } else {
        setActiveDelivery(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };`;

// Replace the old fetchActiveDelivery
const regex = /const fetchActiveDelivery = async \(\) => \{[\s\S]*?finally \{\s*setLoading\(false\);\s*\}\s*\};/g;
code = code.replace(regex, fetchMethod);
fs.writeFileSync('src/pages/VolunteerPortal.tsx', code);
