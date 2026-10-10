const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CertificateCard.tsx', 'utf8');

code = code.replace(/if \(!user\) return;/g, 'if (!user || !profile?.id) return;');
fs.writeFileSync('src/components/dashboard/CertificateCard.tsx', code);
