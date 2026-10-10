const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/NGOLiveMap.tsx', 'utf8');

code = code.replace(
    /let lat = Number\(nData\?\.location_lat \|\| profileData\?\.latitude\);/,
    'let lat = Number(nData?.location_lat || profileData?.latitude || 19.0760);'
);

code = code.replace(
    /let lng = Number\(nData\?\.location_lng \|\| profileData\?\.longitude\);/,
    'let lng = Number(nData?.location_lng || profileData?.longitude || 72.8777);'
);

fs.writeFileSync('src/components/dashboard/NGOLiveMap.tsx', code);
