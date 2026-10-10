const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/AssignVolunteerModal.tsx', 'utf8');

code = code.replace(
  /const handleAssign = async \(volId: string\) => \{[\s\S]*?toast\.success\("Volunteer assigned successfully!"\);\n            onAssigned\(\);\n            onClose\(\);\n        \} catch \(e: any\) \{/m,
  `const handleAssign = async (volId: string) => {
        setIsAssigning(true);
        try {
            // Update donation
            const { error: dErr } = await supabase.from('donations')
                .update({ status: 'assigned' })
                .eq('id', donation.id);
            if (dErr) throw dErr;
            
            const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
            const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

            const { error: dtErr } = await supabase.from('deliveries').insert({
                donation_id: donation.id,
                ngo_id: ngoId,
                volunteer_id: volId,
                status: 'assigned',
                pickup_otp: pickupOtp,
                delivery_otp: deliveryOtp
            });
            if (dtErr) throw dtErr;
            
            toast.success("Volunteer assigned successfully!");
            onAssigned();
            onClose();
        } catch (e: any) {`
);

fs.writeFileSync('src/components/dashboard/AssignVolunteerModal.tsx', code);
