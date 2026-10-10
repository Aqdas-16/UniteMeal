const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/AssignVolunteerModal.tsx', 'utf8');

const replacement = `
            // Ensure the volunteer exists in the volunteers table before assigning
            await supabase.from('volunteers').upsert({ id: volId }, { onConflict: 'id' });

            const { error: dtErr } = await supabase.from('deliveries').insert({
                donation_id: donation.id,
                ngo_id: ngoId,
                volunteer_id: volId,
                status: 'assigned',
                pickup_otp: pickupOtp,
                delivery_otp: deliveryOtp
            });
`;

code = code.replace(
  /const \{ error: dtErr \} = await supabase\.from\('deliveries'\)\.insert\(\{\s*donation_id: donation.id,\s*ngo_id: ngoId,\s*volunteer_id: volId,\s*status: 'assigned',\s*pickup_otp: pickupOtp,\s*delivery_otp: deliveryOtp\s*\}\);/,
  replacement
);

fs.writeFileSync('src/components/dashboard/AssignVolunteerModal.tsx', code);
