const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/AssignVolunteerModal.tsx', 'utf8');

code = code.replace(
    /if \(pErr\) throw pErr;/g,
    `if (pErr) throw pErr;
            const { error: dtErr } = await supabase.from('delivery_tracking').insert({
                donation_id: donation.id,
                restaurant_id: donation.donor_id,
                ngo_id: ngoId,
                volunteer_id: volId,
                status: 'waiting'
            });
            if (dtErr) console.error("Delivery tracking insert error:", dtErr);`
);

fs.writeFileSync('src/components/dashboard/AssignVolunteerModal.tsx', code);
console.log("Updated AssignVolunteerModal");
