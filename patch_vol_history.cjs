const fs = require('fs');
let code = fs.readFileSync('src/pages/VolunteerHistory.tsx', 'utf8');

const target = `export function VolunteerHistory() {`;
const replacement = `import { CertificateCard } from '@/components/dashboard/CertificateCard';\n\nexport function VolunteerHistory() {`;

const target2 = `<div className="w-full">`;
const replacement2 = `<div className="w-full">
         <CertificateCard role="volunteer" />`;

if (!code.includes("CertificateCard")) {
  code = code.replace(target, replacement);
  code = code.replace(target2, replacement2);
  fs.writeFileSync('src/pages/VolunteerHistory.tsx', code);
}
