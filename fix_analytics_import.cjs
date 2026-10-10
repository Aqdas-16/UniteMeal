const fs = require('fs');
let code = fs.readFileSync('src/pages/DonorAnalytics.tsx', 'utf8');

code = code.replace(/import \{ CertificateCard \} from '@\/src\/components\/dashboard\/CertificateCard';\n/g, '');
code = `import { CertificateCard } from '@/src/components/dashboard/CertificateCard';\n` + code;

fs.writeFileSync('src/pages/DonorAnalytics.tsx', code);
