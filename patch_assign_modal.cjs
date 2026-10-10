const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/AssignVolunteerModal.tsx', 'utf8');

code = code.replace(
  /const fetchAvailableVolunteers = async \(\) => \{[^]*?\};/m,
  `const fetchAvailableVolunteers = async () => {
        const { data, error } = await supabase.from('profiles')
            .select('*')
            .eq('role', 'volunteer');
            
        if (data) setVolunteers(data);
    };`
);

fs.writeFileSync('src/components/dashboard/AssignVolunteerModal.tsx', code);
