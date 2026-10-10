const fs = require('fs');
let code = fs.readFileSync('src/pages/VolunteerPortal.tsx', 'utf8');

code = code.replace(
    /destLat = restaurant\.latitude \|\| restaurant\.location_lat;/,
    'destLat = restaurant?.location_lat || restaurant?.latitude;'
);

code = code.replace(
    /destLng = restaurant\.longitude \|\| restaurant\.location_lng;/,
    'destLng = restaurant?.location_lng || restaurant?.longitude;'
);

code = code.replace(
    /destLat = ngo\.latitude;/,
    'destLat = ngo?.location_lat || ngo?.latitude;'
);

code = code.replace(
    /destLng = ngo\.longitude;/,
    'destLng = ngo?.location_lng || ngo?.longitude;'
);

code = code.replace(
    /const centerLat = location\?\.lat \|\| Number\(restaurant\?\.latitude \|\| restaurant\?\.location_lat\) \|\| 19\.0760;/,
    'const centerLat = location?.lat || Number(restaurant?.location_lat || restaurant?.latitude) || 19.0760;'
);

code = code.replace(
    /const centerLng = location\?\.lng \|\| Number\(restaurant\?\.longitude \|\| restaurant\?\.location_lng\) \|\| 72\.8777;/,
    'const centerLng = location?.lng || Number(restaurant?.location_lng || restaurant?.longitude) || 72.8777;'
);


fs.writeFileSync('src/pages/VolunteerPortal.tsx', code);
