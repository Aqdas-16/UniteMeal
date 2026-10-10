const fs = require('fs');

const files = [
  'src/pages/DonorProfile.tsx',
  'src/pages/DonorFeatures.tsx',
  'src/pages/TrackDeliveriesContent.tsx',
  'src/pages/AdminDashboard.tsx',
  'src/pages/NGOIncomingContent.tsx',
  'src/pages/VolunteerPortal.tsx',
  'src/components/dashboard/NGOLiveMap.tsx',
  'src/components/dashboard/DonorLiveMap.tsx',
  'src/components/dashboard/DonationDetailsModal.tsx',
  'src/components/dashboard/CreateDonation.tsx',
  'src/components/ui/LiveTrackingMap.tsx',
];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace import
  if (code.includes(`import { APIProvider`)) {
     code = code.replace(/import\s+\{([^}]*)APIProvider([^}]*)\}\s+from\s+['"]@vis.gl\/react-google-maps['"];/, 
       (match, p1, p2) => {
         const newImports = [p1, p2].map(s => s.trim()).filter(Boolean).join(', ').replace(/,\s*,/g, ',');
         if (newImports && newImports !== ',') {
           return `import { ${newImports} } from '@vis.gl/react-google-maps';\nimport { MapProvider as APIProvider } from '@/components/MapProvider';`;
         } else {
           return `import { MapProvider as APIProvider } from '@/components/MapProvider';`;
         }
       }
     );
  } else if (code.match(/import\s+.*?APIProvider.*?\s+from\s+['"]@vis.gl\/react-google-maps['"];/s)) {
      // Catch-all if it's imported differently
      code = code.replace(/APIProvider\s*,?/, '');
      code = `import { MapProvider as APIProvider } from '@/components/MapProvider';\n` + code;
  }
  
  fs.writeFileSync(file, code);
}
