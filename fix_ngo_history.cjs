const fs = require('fs');
let code = fs.readFileSync('src/pages/NGOHistory.tsx', 'utf8');

const regex = /const \{ data, error \} = await supabase[\s\S]*?\.order\('updated_at', \{ ascending: false \}\);/g;
const replacement = `const { data, error } = await supabase
        .from('deliveries')
        .select(\`
          *,
          donations!inner(*),
          volunteers(profiles(full_name))
        \`)
        .eq('ngo_id', user.uid)
        .in('status', ['completed', 'cancelled', 'failed', 'delivered'])
        .order('updated_at', { ascending: false });`;

const updatedCode = code.replace(regex, replacement);

const regex2 = /task\.ngo_volunteers\?\.name/g;
const replacement2 = `task.volunteers?.profiles?.full_name`;
const updatedCode2 = updatedCode.replace(regex2, replacement2);

fs.writeFileSync('src/pages/NGOHistory.tsx', updatedCode2);
console.log("Updated NGOHistory.tsx");
