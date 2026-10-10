const fs = require('fs');

let code = fs.readFileSync('src/components/dashboard/AssignVolunteerModal.tsx', 'utf8');

const regex = /\.eq\('availability', 'online'\);/g;
const replacement = `.eq('availability', 'online')\n            .eq('ngo_id', ngoId);`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/dashboard/AssignVolunteerModal.tsx', code);
