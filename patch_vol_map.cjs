const fs = require('fs');
let code = fs.readFileSync('src/pages/VolunteerPortal.tsx', 'utf8');

code = code.replace(
    /position=\{\{ lat: Number\(ngo\.latitude\), lng: Number\(ngo\.longitude\) \}\}/,
    'position={{ lat: Number(ngo?.location_lat || ngo?.latitude), lng: Number(ngo?.location_lng || ngo?.longitude) }}'
);

code = code.replace(
    /position=\{\{ lat: Number\(restaurant\.latitude \|\| restaurant\.location_lat\), lng: Number\(restaurant\.longitude \|\| restaurant\.location_lng\) \}\}/,
    'position={{ lat: Number(restaurant?.location_lat || restaurant?.latitude), lng: Number(restaurant?.location_lng || restaurant?.longitude) }}'
);

fs.writeFileSync('src/pages/VolunteerPortal.tsx', code);
