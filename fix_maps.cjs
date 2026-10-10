const fs = require('fs');

function fixMap(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace delivery_tracking with deliveries, and then fetch locations separately
  let replacement = `
    const fetchDrivers = async () => {
        let query = supabase.from('deliveries').select('*, ngo_volunteers:volunteers(*), profiles:volunteer_id(full_name)').in('status', ['accepted', 'heading_to_restaurant', 'arrived_restaurant', 'picked_up', 'heading_to_ngo', 'arrived_ngo']);
        if (isRest) {
            query = query.eq('donations.donor_id', user.uid); // Will need inner join if supabase allows or just fetch active for rest
        } else if (isNGO) {
            query = query.eq('ngo_id', user.uid);
        }
        
        // Simpler for this:
        const { data: deliveries } = await query;
        if (deliveries && deliveries.length > 0) {
            const deliveryIds = deliveries.map(d => d.id);
            const { data: locs } = await supabase.from('delivery_locations')
                .select('*')
                .in('delivery_id', deliveryIds)
                .order('recorded_at', { ascending: false });
                
            const driverLocs = [];
            for (const d of deliveries) {
                // Find latest loc for this delivery
                const loc = locs?.find(l => l.delivery_id === d.id);
                if (loc) {
                    driverLocs.push({
                        id: d.id,
                        lat: loc.location_lat,
                        lng: loc.location_lng,
                        ngo_id: d.ngo_id,
                        volunteer: { name: d.profiles?.full_name || 'Volunteer' },
                        status: d.status,
                        heading: loc.heading || 0
                    });
                }
            }
            setDrivers(driverLocs);
        } else {
            setDrivers([]);
        }
    };
`;

  // Actually, wait, DonorLiveMap has isRest / isNGO check.
  // NGOLiveMap just fetches for NGO. Let's do it individually using standard js replace.
}
