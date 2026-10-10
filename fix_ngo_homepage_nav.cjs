const fs = require('fs');
let code = fs.readFileSync('src/pages/NGOHomepage.tsx', 'utf8');

const oldStr = `onClick={() => navigate('/dashboard/ngo/history')}`;
const newStr = `onClick={() => navigate('/dashboard/ngo/track')}`;

if (code.includes(oldStr)) {
    code = code.replace(oldStr, newStr);
    fs.writeFileSync('src/pages/NGOHomepage.tsx', code);
    console.log("Updated NGOHomepage.tsx");
}
