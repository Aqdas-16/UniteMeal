const fs = require('fs');
let code = fs.readFileSync('src/pages/TrackDeliveriesContent.tsx', 'utf8');
code = code.split('\\`').join('`');
code = code.split('\\$').join('$');
fs.writeFileSync('src/pages/TrackDeliveriesContent.tsx', code);
