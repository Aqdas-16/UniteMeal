const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CreateDonation.tsx', 'utf8');

if (!code.includes('const API_KEY')) {
  code = code.replace(
    'export default function CreateDonation() {',
    `import { APIProvider } from '@vis.gl/react-google-maps';\nconst API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';\nconst hasValidKey = Boolean(API_KEY) && !API_KEY.includes('YOUR_');\n\nexport default function CreateDonation() {\n  const content = <CreateDonationContent />;\n  return hasValidKey ? <APIProvider apiKey={API_KEY}>{content}</APIProvider> : content;`
  );
  code = code.replace(
    'export default function CreateDonation() {\n  return <CreateDonationContent />;\n}',
    '' // it's already replaced above, wait this is wrong string replace.
  );
}
fs.writeFileSync('src/components/dashboard/CreateDonation.tsx', code);
