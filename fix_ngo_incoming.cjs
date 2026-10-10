const fs = require('fs');
let code = fs.readFileSync('src/pages/NGOIncomingContent.tsx', 'utf8');

const oldQuery = `.select('*, profiles:donor_id(full_name, avatar_url), donors:donor_id(organization_name), donation_images(image_url), food_quality_assessments(*)')`;
const newQuery = `.select('*, profiles:donor_id(full_name, avatar_url), donors:donor_id(organization_name)')`;

if (code.includes(oldQuery)) {
    code = code.replace(oldQuery, newQuery);
    fs.writeFileSync('src/pages/NGOIncomingContent.tsx', code);
    console.log("Updated NGOIncomingContent.tsx");
} else {
    console.log("Could not find old query in NGOIncomingContent.tsx");
}
