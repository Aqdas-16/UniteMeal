const fs = require('fs');

let code = fs.readFileSync('src/pages/VolunteerPortal.tsx', 'utf8');
code = code.replace(/user\.id/g, 'user.uid');
fs.writeFileSync('src/pages/VolunteerPortal.tsx', code);
