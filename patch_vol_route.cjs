const fs = require('fs');
let code = fs.readFileSync('src/pages/VolunteerPortal.tsx', 'utf8');

code = code.replace(
    /dest = \{ lat: Number\(restaurant\.latitude \|\| restaurant\.location_lat\), lng: Number\(restaurant\.longitude \|\| restaurant\.location_lng\) \};/,
    'dest = { lat: Number(restaurant?.location_lat || restaurant?.latitude), lng: Number(restaurant?.location_lng || restaurant?.longitude) };'
);

code = code.replace(
    /dest = \{ lat: Number\(ngo\.latitude\), lng: Number\(ngo\.longitude\) \};/,
    'dest = { lat: Number(ngo?.location_lat || ngo?.latitude), lng: Number(ngo?.location_lng || ngo?.longitude) };'
);

fs.writeFileSync('src/pages/VolunteerPortal.tsx', code);
