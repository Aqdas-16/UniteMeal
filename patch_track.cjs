const fs = require('fs');
let code = fs.readFileSync('src/pages/TrackDeliveriesContent.tsx', 'utf8');

code = code.replace(
  /let query = supabase.from\('deliveries'\)\n            \.select\('\*, donations\(\*\), ngo:ngos\(\*\), volunteer:profiles!volunteer_id\(\*\)'\)/,
  `let query = supabase.from('deliveries')
            .select('*, donations(*), ngo:ngos(*)')`
);

code = code.replace(
  /const enhanced = await Promise.all\(filtered.map\(async \(d\) => \{/,
  `const enhanced = await Promise.all(filtered.map(async (d) => {
               const { data: vData } = await supabase.from('profiles').select('*').eq('id', d.volunteer_id).maybeSingle();
               d.volunteer = vData;`
);

fs.writeFileSync('src/pages/TrackDeliveriesContent.tsx', code);
