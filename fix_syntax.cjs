const fs = require('fs');
let code = fs.readFileSync('src/pages/VolunteerPortal.tsx', 'utf8');
code = code.replace(/\{ enableHighAccuracy: true, maximumAge: 5000 \}\n\s*\{ enableHighAccuracy: true, maximumAge: 0, timeout: 10000 \}/, '{ enableHighAccuracy: true, maximumAge: 5000 }');
fs.writeFileSync('src/pages/VolunteerPortal.tsx', code);
