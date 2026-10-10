const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf-8');

code = code.replace(/Business Profile/g, "Profile");
code = code.replace(/Business Name/g, "Profile Name");

fs.writeFileSync('src/pages/SettingsPage.tsx', code);
console.log('Replaced Business Profile in Settings');
