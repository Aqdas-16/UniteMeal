const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CertificateCard.tsx', 'utf8');

// Fix NGO and Donor status check
code = code.replace(
  /\.eq\('status', 'completed'\)/g,
  `.in('status', ['completed', 'delivered'])`
);

// Fix Volunteer table check
code = code.replace(
  /from\('pickup_tasks'\)/g,
  `from('deliveries')`
);

fs.writeFileSync('src/components/dashboard/CertificateCard.tsx', code);
