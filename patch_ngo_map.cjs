const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/NGOLiveMap.tsx', 'utf8');

code = code.replace(
    /const dLatVal = Number\(r\.latitude\);/,
    'const dLatVal = Number(r.location_lat || r.latitude);'
);

code = code.replace(
    /const dLngVal = Number\(r\.longitude\);/,
    'const dLngVal = Number(r.location_lng || r.longitude);'
);

code = code.replace(
    /location_lat: r\.latitude,/,
    'location_lat: r.location_lat || r.latitude,'
);

code = code.replace(
    /location_lng: r\.longitude,/,
    'location_lng: r.location_lng || r.longitude,'
);

fs.writeFileSync('src/components/dashboard/NGOLiveMap.tsx', code);
