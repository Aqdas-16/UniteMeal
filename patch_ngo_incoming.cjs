const fs = require('fs');
let code = fs.readFileSync('src/pages/NGOIncomingContent.tsx', 'utf8');

code = code.replace(
  /\.select\('\*, profiles:restaurant_id\(full_name, avatar_url\), donors:donor_id\(organization_name\), donation_images\(image_url\)'\)/,
  ".select('*, profiles:restaurant_id(full_name, avatar_url), donors:donor_id(organization_name), donation_images(image_url), food_quality_assessments(*)')"
);

fs.writeFileSync('src/pages/NGOIncomingContent.tsx', code);
