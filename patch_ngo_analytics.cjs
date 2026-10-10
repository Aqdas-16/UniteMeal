const fs = require('fs');
let code = fs.readFileSync('src/pages/NGOAnalytics.tsx', 'utf8');

const target = `export function NGOAnalytics() {`;
const replacement = `import { CertificateCard } from '@/components/dashboard/CertificateCard';\n\nexport function NGOAnalytics() {`;

const target2 = `<div className="space-y-6">`;
const replacement2 = `<div className="space-y-6">
      <CertificateCard role="ngo" />`;

if (!code.includes("CertificateCard")) {
  code = code.replace(target, replacement);
  code = code.replace(target2, replacement2);
  fs.writeFileSync('src/pages/NGOAnalytics.tsx', code);
}
