const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace('{/* MAP */}', '<div className="grid grid-cols-1 xl:grid-cols-4 gap-6">\n{/* MAP */}');

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
