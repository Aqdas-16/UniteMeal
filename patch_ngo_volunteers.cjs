const fs = require('fs');
let code = fs.readFileSync('src/pages/NGOVolunteersContent.tsx', 'utf8');

code = code.replace(/Delivery partner added successfully./g, 'Team member added successfully.');
code = code.replace(/Delivery Partners/g, 'Team Members');
code = code.replace(/Add Delivery Partner/g, 'Add Team Member');
code = code.replace(/No Delivery Partners/g, 'No Team Members');

fs.writeFileSync('src/pages/NGOVolunteersContent.tsx', code);
