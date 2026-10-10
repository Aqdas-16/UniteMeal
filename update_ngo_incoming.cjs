const fs = require('fs');

let code = fs.readFileSync('src/pages/NGOIncomingContent.tsx', 'utf8');

const regex = /const { data } = await supabase\s*\.from\('donations'\)\s*\.select\('\*, profiles:restaurant_id\(full_name, avatar_url\), donors:donor_id\(organization_name\), donation_images\(image_url\), food_quality_assessments\(\*\)'\)\s*\.eq\('status', 'available'\);/g;

const replacement = `const { data } = await supabase
      .from('donations')
      .select('*, profiles:donor_id(full_name, avatar_url), donors:donor_id(organization_name), donation_images(image_url), food_quality_assessments(*)')
      .eq('status', 'available')
      .or(\`ngo_id.eq.\${user.uid},ngo_id.is.null\`); // Only show donations meant for this NGO or open to all
`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/pages/NGOIncomingContent.tsx', code);
