const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(/h-\[350px\]/g, 'h-[600px]');
fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
