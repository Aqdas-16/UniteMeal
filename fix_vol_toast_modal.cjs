const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/AssignVolunteerModal.tsx', 'utf8');

code = code.replace(
    /toast\.success\("Volunteer added!"\);/g,
    "toast.success(\"Volunteer added successfully.\");"
);

fs.writeFileSync('src/components/dashboard/AssignVolunteerModal.tsx', code);
console.log("Fixed Volunteer toast modal");
