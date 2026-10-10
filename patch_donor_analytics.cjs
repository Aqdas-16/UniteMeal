const fs = require('fs');
let code = fs.readFileSync('src/pages/DonorAnalytics.tsx', 'utf8');

const target = `export function DonorAnalytics() {`;
const replacement = `import { CertificateCard } from '@/components/dashboard/CertificateCard';\n\nexport function DonorAnalytics() {`;

const target2 = `<div className="max-w-7xl mx-auto space-y-6">`;
const replacement2 = `<div className="max-w-7xl mx-auto space-y-6">
        <CertificateCard role="donor" />`;

if (!code.includes("CertificateCard")) {
  code = code.replace(target, replacement);
  code = code.replace(target2, replacement2);
  fs.writeFileSync('src/pages/DonorAnalytics.tsx', code);
}
