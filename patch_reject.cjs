const fs = require('fs');

let code = fs.readFileSync('src/pages/VolunteerPortal.tsx', 'utf8');

// Add "Reject Assignment" button
code = code.replace(
  /<Button onClick=\{\(\) => updateStatus\('accepted'\)\} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">\s*Accept Assignment\s*<\/Button>/,
  `<div className="flex gap-3">
                    <Button onClick={() => updateStatus('rejected')} variant="outline" className="flex-1 h-12 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                      Reject Assignment
                    </Button>
                    <Button onClick={() => updateStatus('accepted')} className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                      Accept Assignment
                    </Button>
                  </div>`
);

// Update status logic
code = code.replace(
  /if \(error\) throw error;/,
  `if (error) throw error;
      
      if (newStatus === 'rejected') {
          // Reset donation status back to accepted (by NGO) so they can re-assign
          await supabase.from('donations').update({ assigned_volunteer_id: null, status: 'accepted' }).eq('id', activeDelivery.donation_id);
          setActiveDelivery(null);
          setDonation(null);
          setRestaurant(null);
          setNgo(null);
          return;
      }`
);

fs.writeFileSync('src/pages/VolunteerPortal.tsx', code);
