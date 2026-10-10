const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DonorLiveMap.tsx', 'utf8');

const targetEffect = `    const fetchOtherLocations = async () => {
      const { data: n } = await supabase.from('ngos').select('*');
      if (n) setNgos(n);
      const { data: v } = await supabase.from('volunteers').select('*').eq('availability_status', true);
      if (v) setRiders(v);
    };
    
    fetchOtherLocations();
    
    return () => { supabase.removeChannel(channel); };
  }, [userId]);`;

const replacementEffect = `    const fetchDeliveriesAndLocations = async () => {
      const { data: n } = await supabase.from('ngos').select('*');
      if (n) setNgos(n);
      
      // Fetch active deliveries for this donor's donations
      const { data: donations } = await supabase.from('donations').select('id').eq('donor_id', userId).in('status', ['accepted', 'assigned', 'in_transit', 'picked_up']);
      const donationIds = donations?.map(d => d.id) || [];
      
      if (donationIds.length > 0) {
          const { data: deliveries } = await supabase.from('deliveries').select('volunteer_id, status, ngo_id').in('donation_id', donationIds).in('status', ['accepted', 'in_transit']);
          const activeDelivery = deliveries?.[0];
          
          if (activeDelivery && activeDelivery.volunteer_id) {
              const { data: v } = await supabase.from('volunteers').select('*').eq('id', activeDelivery.volunteer_id).single();
              if (v) setActiveDeliveryRider(v);
          } else {
              setActiveDeliveryRider(null);
          }
      } else {
          setActiveDeliveryRider(null);
      }
    };
    
    fetchDeliveriesAndLocations();
    
    // Subscribe to deliveries and donations changes
    const delChannel = supabase.channel('donor_deliveries')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, () => fetchDeliveriesAndLocations())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => fetchDeliveriesAndLocations())
        .subscribe();
    
    return () => { 
        supabase.removeChannel(channel);
        supabase.removeChannel(delChannel);
    };
  }, [userId]);`;

code = code.replace(targetEffect, replacementEffect);
fs.writeFileSync('src/components/dashboard/DonorLiveMap.tsx', code);
