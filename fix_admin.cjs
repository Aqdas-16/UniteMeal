const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminFeatures.tsx', 'utf8');

// NGO fixes
code = code.replace(/key=\{n\.ngo_id\}/g, 'key={n.id}');
code = code.replace(/n\.ngo_id/g, 'n.id');
code = code.replace(/n\.profile_id/g, 'n.id');

// Restaurant fixes
code = code.replace(/d\.restaurant_id === r\.restaurant_id/g, 'd.user_id === r.user_id');
code = code.replace(/key=\{doc\.document_id\}/g, 'key={doc.id}');
code = code.replace(/doc\.document_id/g, 'doc.id');
code = code.replace(/doc\.document_url/g, 'doc.file_url');

fs.writeFileSync('src/pages/AdminFeatures.tsx', code);
