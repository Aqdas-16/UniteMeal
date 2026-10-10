const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('CertificateWidget')) {
  code = code.replace(
    "import { FloatingAssistant } from './components/FloatingAssistant';",
    "import { FloatingAssistant } from './components/FloatingAssistant';\nimport { CertificateWidget } from './components/dashboard/CertificateWidget';"
  );
  
  code = code.replace(
    /<FloatingAssistant \/>/g,
    '<CertificateWidget /><FloatingAssistant />'
  );
  
  fs.writeFileSync('src/App.tsx', code);
}
