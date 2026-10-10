const fs = require('fs');
let code = fs.readFileSync('src/pages/DonorAnalytics.tsx', 'utf8');

const target = `<div className="sr-only">
        <PageHeader title="Analytics" breadcrumbs={[{label: 'Analytics'}]} />
      </div>`;
const replacement = `<div className="sr-only">
        <PageHeader title="Analytics" breadcrumbs={[{label: 'Analytics'}]} />
      </div>
      
      <CertificateCard role="donor" />`;

code = code.replace(target, replacement);

// Make sure the import is there
if (!code.includes("import { CertificateCard }")) {
    code = `import { CertificateCard } from '@/src/components/dashboard/CertificateCard';\n` + code;
}

fs.writeFileSync('src/pages/DonorAnalytics.tsx', code);
