const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Remove AI Operations Match Engine
const aiRegex = /\{\/\* AI OP PANEL \*\/\}[\s\S]*?\{\/\* LIVE ACTIVITY FEED \*\/\}/;
code = code.replace(aiRegex, '{/* LIVE ACTIVITY FEED */}');

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
