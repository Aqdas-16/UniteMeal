const fs = require('fs');
let code = fs.readFileSync('src/pages/NGOVolunteersContent.tsx', 'utf8');

code = code.replace(
    /setFormData\(\{ name: '', phone: '', email: '', role: '', availability: true, status: 'available' \}\);/g,
    "setFormData({ name: '', phone: '', email: '', role: '', availability: true, status: 'available' });\n      fetchTeam();"
);

code = code.replace(
    /toast\.success\("Volunteer removed"\);/g,
    "toast.success(\"Volunteer removed\");\n      fetchTeam();"
);

fs.writeFileSync('src/pages/NGOVolunteersContent.tsx', code);
console.log("Fixed Volunteer fetchTeam");
