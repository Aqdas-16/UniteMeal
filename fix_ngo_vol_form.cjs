const fs = require('fs');
let code = fs.readFileSync('src/pages/NGOVolunteersContent.tsx', 'utf8');

code = code.replace('<Label>Email (Optional Login)</Label>', '<Label>Email (Required for Login)</Label>');
code = code.replace('<Input type="email" value={formData.email}', '<Input required type="email" value={formData.email}');
code = code.replace('if (!formData.name || !formData.phone || !formData.password)', 'if (!formData.name || !formData.phone || !formData.email || !formData.password)');

fs.writeFileSync('src/pages/NGOVolunteersContent.tsx', code);
console.log("Updated NGOVolunteersContent.tsx");
