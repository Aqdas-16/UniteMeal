const fs = require('fs');

let code = fs.readFileSync('src/pages/TrackDeliveriesContent.tsx', 'utf8');

code = code.replace(
  /if \(!map \|\| !window.google\) return;\n\s*const newRenderer = new window.google.maps.DirectionsRenderer/,
  `if (!map || !window.google || !window.google.maps || !window.google.maps.DirectionsRenderer) return;
        const newRenderer = new window.google.maps.DirectionsRenderer`
);

code = code.replace(
  /travelMode: window.google.maps.TravelMode.DRIVING/g,
  `travelMode: window.google?.maps?.TravelMode?.DRIVING || 'DRIVING'`
);

fs.writeFileSync('src/pages/TrackDeliveriesContent.tsx', code);

// Same for VolunteerPortal
let vol = fs.readFileSync('src/pages/VolunteerPortal.tsx', 'utf8');
vol = vol.replace(
  /travelMode: window.google.maps.TravelMode.DRIVING/g,
  `travelMode: window.google?.maps?.TravelMode?.DRIVING || 'DRIVING'`
);
fs.writeFileSync('src/pages/VolunteerPortal.tsx', vol);

