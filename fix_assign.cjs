const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/AssignVolunteerModal.tsx', 'utf8');

code = code.replace(
  /const fallback = await supabase.from\('profiles'\).select\('\*'\).eq\('role', 'volunteer'\);\n\s*if \(fallback.data\) setVolunteers\(fallback.data\);/,
  `const fallback = await supabase.from('profiles').select('*').eq('role', 'volunteer');
            if (fallback.data) {
                const formatted = fallback.data.map((v: any) => ({
                    id: v.id,
                    full_name: v.full_name || 'Unknown Volunteer',
                    phone_number: v.phone_number || '',
                    email: v.email || '',
                    role: 'volunteer',
                    vehicle_type: 'unknown'
                }));
                setVolunteers(formatted);
            }`
);
fs.writeFileSync('src/components/dashboard/AssignVolunteerModal.tsx', code);
