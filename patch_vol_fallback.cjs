const fs = require('fs');
let code = fs.readFileSync('src/pages/VolunteerPortal.tsx', 'utf8');

code = code.replace(
    /dest = \{ lat: Number\(restaurant\?\.location_lat \|\| restaurant\?\.latitude\), lng: Number\(restaurant\?\.location_lng \|\| restaurant\?\.longitude\) \};/,
    'dest = { lat: Number(restaurant?.location_lat || restaurant?.latitude || 19.0760), lng: Number(restaurant?.location_lng || restaurant?.longitude || 72.8777) };'
);

code = code.replace(
    /dest = \{ lat: Number\(ngo\?\.location_lat \|\| ngo\?\.latitude\), lng: Number\(ngo\?\.location_lng \|\| ngo\?\.longitude\) \};/,
    'dest = { lat: Number(ngo?.location_lat || ngo?.latitude || 19.0760), lng: Number(ngo?.location_lng || ngo?.longitude || 72.8777) };'
);

code = code.replace(
    /position=\{\{ lat: Number\(restaurant\?\.location_lat \|\| restaurant\?\.latitude\), lng: Number\(restaurant\?\.location_lng \|\| restaurant\?\.longitude\) \}\}/,
    'position={{ lat: Number(restaurant?.location_lat || restaurant?.latitude || 19.0760), lng: Number(restaurant?.location_lng || restaurant?.longitude || 72.8777) }}'
);

code = code.replace(
    /position=\{\{ lat: Number\(ngo\?\.location_lat \|\| ngo\?\.latitude\), lng: Number\(ngo\?\.location_lng \|\| ngo\?\.longitude\) \}\}/,
    'position={{ lat: Number(ngo?.location_lat || ngo?.latitude || 19.0760), lng: Number(ngo?.location_lng || ngo?.longitude || 72.8777) }}'
);

fs.writeFileSync('src/pages/VolunteerPortal.tsx', code);
