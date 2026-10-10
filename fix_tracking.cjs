const fs = require('fs');

const files = [
  'src/components/ui/LiveTrackingMap.tsx',
  'src/pages/TrackDeliveriesContent.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/loc\.latitude/g, 'loc.location_lat');
    code = code.replace(/loc\.longitude/g, 'loc.location_lng');
    fs.writeFileSync(file, code);
  }
}

let vol = fs.readFileSync('src/pages/VolunteerPortal.tsx', 'utf8');
vol = vol.replace(/created_at:/g, 'recorded_at:');
fs.writeFileSync('src/pages/VolunteerPortal.tsx', vol);

