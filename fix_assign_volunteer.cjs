const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/AssignVolunteerModal.tsx', 'utf8');

if (code.includes(".update({ status: 'assigned' })")) {
    code = code.replace(".update({ status: 'assigned' })", ".update({ status: 'assigned', ngo_id: ngoId })");
    fs.writeFileSync('src/components/dashboard/AssignVolunteerModal.tsx', code);
    console.log("Updated AssignVolunteerModal.tsx to set ngo_id on donation");
}
