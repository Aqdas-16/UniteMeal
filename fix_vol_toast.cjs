const fs = require('fs');
let code = fs.readFileSync('src/pages/NGOVolunteersContent.tsx', 'utf8');

code = code.replace(
    /toast\.success\("Volunteer added"\);/g,
    "toast.success(\"Volunteer added successfully.\");"
);

fs.writeFileSync('src/pages/NGOVolunteersContent.tsx', code);
console.log("Fixed Volunteer toast");
