const fs = require('fs');
let code = fs.readFileSync('src/pages/NGOIncomingContent.tsx', 'utf8');

const oldSelect = `.select('*, profiles:donor_id(full_name, avatar_url), donors:donor_id(organization_name)')`;
const newSelect = `.select('*, donors:donor_id(organization_name), profiles:restaurant_id(full_name, avatar_url)')`;

code = code.replace(oldSelect, newSelect);
fs.writeFileSync('src/pages/NGOIncomingContent.tsx', code);
console.log("Updated NGOIncomingContent.tsx");
