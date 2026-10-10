const fs = require('fs');
let code = fs.readFileSync('src/pages/NGOVolunteersContent.tsx', 'utf8');

const oldQuery = `.select('*, profiles!inner(full_name, phone_number, email, avatar_url), deliveries(status, donations(title, ngos(organization_name)))')`;
const newQuery = `.select('*, profiles!inner(full_name, phone_number, email, avatar_url), deliveries(status, donations(title))')`;

if (code.includes(oldQuery)) {
    code = code.replace(oldQuery, newQuery);
    fs.writeFileSync('src/pages/NGOVolunteersContent.tsx', code);
    console.log("Updated NGOVolunteersContent.tsx");
} else {
    console.log("Could not find query");
}
