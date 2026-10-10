const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CertificateCard.tsx', 'utf8');

code = code.replace(/user\.id/g, 'profile?.id');
code = code.replace(/user\?\.id/g, 'profile?.id');

fs.writeFileSync('src/components/dashboard/CertificateCard.tsx', code);
