const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(
    "<p className=\"text-2xl font-bold mt-1\">{ngos.length}</p>",
    "<p className=\"text-2xl font-bold mt-1\">{ngosTable.length}</p>"
);

code = code.replace(
    "<p className=\"text-2xl font-bold mt-1\">{donors.length}</p>",
    "<p className=\"text-2xl font-bold mt-1\">{restaurantsTable.length}</p>"
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
