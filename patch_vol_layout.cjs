const fs = require('fs');
let code = fs.readFileSync('src/components/layout/VolunteerDashboardLayout.tsx', 'utf8');

if (!code.includes('CertificateWidget')) {
  code = code.replace(
    "import { FloatingAssistant } from '@/src/components/FloatingAssistant';",
    "import { FloatingAssistant } from '@/src/components/FloatingAssistant';\nimport { CertificateWidget } from '@/src/components/dashboard/CertificateWidget';"
  );
  
  code = code.replace(
    /<FloatingAssistant \/>/,
    '<CertificateWidget />\n      <FloatingAssistant />'
  );
  
  fs.writeFileSync('src/components/layout/VolunteerDashboardLayout.tsx', code);
}
