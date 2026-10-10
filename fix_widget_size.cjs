const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CertificateWidget.tsx', 'utf8');

code = code.replace(
  `className="fixed bottom-24 right-6 sm:bottom-6 sm:right-24 z-[40] w-12 h-12`,
  `className="fixed bottom-24 right-6 sm:bottom-6 sm:right-24 z-[40] w-14 h-14`
);

fs.writeFileSync('src/components/dashboard/CertificateWidget.tsx', code);
