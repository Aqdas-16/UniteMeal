const fs = require('fs');

// TrackDeliveriesContent.tsx
let f1 = fs.readFileSync('src/pages/TrackDeliveriesContent.tsx', 'utf8');
f1 = f1.replace(/\}\)\.catch\(e => console\.warn\("Directions Route failed", e\)\);/g, '});');
fs.writeFileSync('src/pages/TrackDeliveriesContent.tsx', f1);

// VolunteerPortal.tsx
let f2 = fs.readFileSync('src/pages/VolunteerPortal.tsx', 'utf8');
f2 = f2.replace(/\}\)\.catch\(\(e: any\) => console\.warn\("Directions Route failed", e\)\);/g, '});');
fs.writeFileSync('src/pages/VolunteerPortal.tsx', f2);

// NGOLiveMap.tsx
let f3 = fs.readFileSync('src/components/dashboard/NGOLiveMap.tsx', 'utf8');
f3 = f3.replace(/setRouteInfo\(\{([\s\S]*?)\}\)\.catch\(e => console\.warn\("Directions Route failed", e\)\);/g, 'setRouteInfo({$1});\n    }).catch(e => console.warn("Directions Route failed", e));');
fs.writeFileSync('src/components/dashboard/NGOLiveMap.tsx', f3);

