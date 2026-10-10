const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(
    "ngos.slice(0, 5).forEach",
    "ngosTable.slice(0, 5).forEach"
);

code = code.replace(
    "}, [donations, deliveries, ngos]);",
    "}, [donations, deliveries, ngosTable]);"
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
