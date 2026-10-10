const fs = require('fs');

let modal = fs.readFileSync('src/components/dashboard/AssignVolunteerModal.tsx', 'utf8');

modal = modal.replace(
  /const fetchAvailableVolunteers = async \(\) => \{[\s\S]*?if \(data\) setVolunteers\(data\);\n    \};/,
  `const fetchAvailableVolunteers = async () => {
        // Fetch approved, online, and active volunteers
        const { data, error } = await supabase.from('volunteers')
            .select('*, profiles!inner(*)')
            .eq('approved', true)
            .eq('status', 'active')
            .eq('availability', 'online');
            
        // Note: data is array of { ..., profiles: { ... } }
        if (data) {
            // Flatten it to match what the component expects
            const formatted = data.map((v: any) => ({
                id: v.id,
                full_name: v.profiles?.full_name || 'Unknown Volunteer',
                phone_number: v.profiles?.phone_number || '',
                email: v.profiles?.email || '',
                role: 'volunteer',
                vehicle_type: v.vehicle_type
            }));
            setVolunteers(formatted);
        } else if (error) {
            console.error("Error fetching volunteers:", error);
            // Fallback for missing columns during development
            const fallback = await supabase.from('profiles').select('*').eq('role', 'volunteer');
            if (fallback.data) setVolunteers(fallback.data);
        }
    };`
);

fs.writeFileSync('src/components/dashboard/AssignVolunteerModal.tsx', modal);
