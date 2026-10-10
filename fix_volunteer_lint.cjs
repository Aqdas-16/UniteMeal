const fs = require('fs');
let code = fs.readFileSync('src/pages/VolunteerPortal.tsx', 'utf8');

// Remove it from fetchActiveDelivery
code = code.replace(
  /if \(error\) throw error;\s*if \(newStatus === 'cancelled'\) \{[\s\S]*?return;\s*\}/,
  'if (error && error.code !== "PGRST116") console.error(error); // ignore no rows'
);

// Add it to updateStatus
code = code.replace(
  /const updateStatus = async \(newStatus: string, otpField\?: string, otpValue\?: string\) => \{[\s\S]*?if \(!activeDelivery \|\| !user\) return;\n\s*try \{\n/,
  `const updateStatus = async (newStatus: string, otpField?: string, otpValue?: string) => {
    if (!activeDelivery || !user) return;
    try {
      if (newStatus === 'cancelled') {
          // Reset donation status back to accepted (by NGO) so they can re-assign
          await supabase.from('donations').update({ assigned_volunteer_id: null, status: 'accepted' }).eq('id', activeDelivery.donation_id);
          setActiveDelivery(null);
          setDonation(null);
          setRestaurant(null);
          setNgo(null);
          
          await supabase.from('deliveries').update({ status: 'cancelled' }).eq('id', activeDelivery.id);
          return;
      }
`
);

fs.writeFileSync('src/pages/VolunteerPortal.tsx', code);
