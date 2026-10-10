const fs = require('fs');
let code = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');

code = code.replace(/gap-6 lg:gap-8/g, "gap-4 lg:gap-6");

fs.writeFileSync('src/pages/LandingPage.tsx', code);
