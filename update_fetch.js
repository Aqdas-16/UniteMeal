const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DonorLiveMap.tsx', 'utf8');

const target = `    const fetchOtherLocations = async () => {
      const { data: n } = await supabase.from('ngos').select('*');
      if (n) setNgos(n);
      const { data: v } = await supabase.from('volunteers').select('*').eq('availability_status', true);
      if (v) setRiders(v);
    };`;

const replacement = `    const fetchOtherLocations = async () => {
      const { data: n } = await supabase.from('ngos').select('*');
      if (n) setNgos(n);
      const { data: v } = await supabase.from('volunteers').select('*').eq('availability_status', true);
      if (v) setRiders(v);
      
      const { data: dData } = await supabase.from('donations').select('id').eq('donor_id', userId);
      if (dData && dData.length > 0) {
          const donationIds = dData.map((d) => d.id);
          const { data: activeDeliveries } = await supabase
            .from('deliveries')
            .select('*, volunteer:volunteer_id(*)')
            .in('donation_id', donationIds)
            .in('status', ['assigned', 'picked_up']);
            
          if (activeDeliveries && activeDeliveries.length > 0) {
              const delivery = activeDeliveries[0];
              if (delivery.volunteer) {
                  setActiveDeliveryRider(Array.isArray(delivery.volunteer) ? delivery.volunteer[0] : delivery.volunteer);
              }
          } else {
              setActiveDeliveryRider(null);
          }
      }
    };`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/dashboard/DonorLiveMap.tsx', code);
