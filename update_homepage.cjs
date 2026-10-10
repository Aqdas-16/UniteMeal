const fs = require('fs');

let code = fs.readFileSync('src/pages/NGOHomepage.tsx', 'utf8');

code = code.replace("import { Footer } from '../components/layout/Footer';", "import { Footer } from '../components/layout/Footer';\nimport { AssignVolunteerModal } from '../components/dashboard/AssignVolunteerModal';");

code = code.replace(
  /const \[metricsLoading, setMetricsLoading\] = useState\(true\);/,
  `const [metricsLoading, setMetricsLoading] = useState(true);\n  const [assigningDonation, setAssigningDonation] = useState<any>(null);`
);

const handleAcceptRegex = /const handleAccept = async \([\s\S]*?\};\n/;
const newHandleAccept = `const handleAccept = (donation: any) => {
    setAssigningDonation(donation);
  };\n`;

code = code.replace(handleAcceptRegex, newHandleAccept);

code = code.replace(
  /return \(/,
  `return (\n    <div className="flex flex-col w-full font-sans pb-12">\n      {assigningDonation && <AssignVolunteerModal isOpen={!!assigningDonation} onClose={() => setAssigningDonation(null)} donation={assigningDonation} ngoId={user?.uid || ''} onAssigned={() => { navigate('/dashboard/ngo/track'); }} />}\n`
);

// We added `<div className="flex flex-col w-full font-sans pb-12">` twice, let's just replace it carefully.
code = fs.readFileSync('src/pages/NGOHomepage.tsx', 'utf8');

code = code.replace("import { Footer } from '../components/layout/Footer';", "import { Footer } from '../components/layout/Footer';\nimport { AssignVolunteerModal } from '../components/dashboard/AssignVolunteerModal';");

code = code.replace(
  /const \[metricsLoading, setMetricsLoading\] = useState\(true\);/,
  `const [metricsLoading, setMetricsLoading] = useState(true);\n  const [assigningDonation, setAssigningDonation] = useState<any>(null);`
);

code = code.replace(handleAcceptRegex, newHandleAccept);

code = code.replace(
  /<div className="flex flex-col w-full font-sans pb-12">/,
  `<div className="flex flex-col w-full font-sans pb-12">\n      {assigningDonation && <AssignVolunteerModal isOpen={!!assigningDonation} onClose={() => setAssigningDonation(null)} donation={assigningDonation} ngoId={user?.uid || ''} onAssigned={() => { navigate('/dashboard/ngo/track'); }} />}`
);

fs.writeFileSync('src/pages/NGOHomepage.tsx', code);
