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
  code = code.replace(/@\/components\/MapProvider/g, '@/src/components/MapProvider');
  fs.writeFileSync(file, code);
}
