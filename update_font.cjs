const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CertificateCard.tsx', 'utf8');

code = code.replace(
  `style={{ fontFamily: '"Playfair Display", "Brush Script MT", "Great Vibes", cursive, serif', letterSpacing: '1px' }}`,
  `style={{ fontFamily: '"Playfair Display", "Dancing Script", "Brush Script MT", cursive', letterSpacing: '1px', textShadow: '1px 1px 0px rgba(0,0,0,0.05)' }}`
);

fs.writeFileSync('src/components/dashboard/CertificateCard.tsx', code);
