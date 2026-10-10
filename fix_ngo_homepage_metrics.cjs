const fs = require('fs');
let code = fs.readFileSync('src/pages/NGOHomepage.tsx', 'utf8');

const regex = /const \{ data: myTasks \} = await supabase\.from\('pickup_tasks'\)[\s\S]*?if \(vols !== null\) setVolunteerCount\(vols\);/g;
const replacement = `const { data: myTasks } = await supabase.from('deliveries')
          .select('*, donations(quantity_kg, estimated_meals), volunteers(profiles(full_name))')
          .eq('ngo_id', user.uid);
          
        const { count: vols } = await supabase.from('volunteers').select('*', { count: 'exact', head: true }).eq('ngo_id', user.uid);
        if (vols !== null) setVolunteerCount(vols);`;

const updatedCode1 = code.replace(regex, replacement);

const regex2 = /\.on\('postgres_changes', \{ event: '\*', schema: 'public', table: 'pickup_tasks'/;
const replacement2 = `.on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries'`;
const updatedCode2 = updatedCode1.replace(regex2, replacement2);

const regex3 = /\.on\('postgres_changes', \{ event: '\*', schema: 'public', table: 'ngo_volunteers'/;
const replacement3 = `.on('postgres_changes', { event: '*', schema: 'public', table: 'volunteers'`;
const updatedCode3 = updatedCode2.replace(regex3, replacement3);

const regex4 = /desc: \`From \$\{t\.profiles\?\.full_name \|\| 'Restaurant'\} • Vol: \$\{t\.ngo_volunteers\?\.name \|\| 'Unassigned'\}\`,/;
const replacement4 = `desc: \`Vol: \$\{t.volunteers?.profiles?.full_name || 'Unassigned'\}\`,`;
const updatedCode4 = updatedCode3.replace(regex4, replacement4);

fs.writeFileSync('src/pages/NGOHomepage.tsx', updatedCode4);
console.log("Updated NGOHomepage.tsx");
