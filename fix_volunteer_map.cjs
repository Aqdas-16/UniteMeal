const fs = require('fs');

let code = fs.readFileSync('src/pages/VolunteerPortal.tsx', 'utf8');
code = code.replace(
  /if \(window.google && !directionsRender\) \{\n\s*setDirectionsRender\(new window.google.maps.DirectionsRenderer\(\{\n\s*suppressMarkers: true,\n\s*polylineOptions: \{ strokeColor: '#10b981', strokeWeight: 5, strokeOpacity: 0.8 \}\n\s*\}\)\);\n\s*setDirectionsSvc\(new window.google.maps.DirectionsService\(\)\);\n\s*\}/,
  `if (window.google && !directionsRender) {
      try {
        if (window.google.maps && window.google.maps.DirectionsRenderer && window.google.maps.DirectionsService) {
          setDirectionsRender(new window.google.maps.DirectionsRenderer({
            suppressMarkers: true,
            polylineOptions: { strokeColor: '#10b981', strokeWeight: 5, strokeOpacity: 0.8 }
          }));
          setDirectionsSvc(new window.google.maps.DirectionsService());
        }
      } catch (e) {
        console.warn("Directions API failed to load", e);
      }
    }`
);
fs.writeFileSync('src/pages/VolunteerPortal.tsx', code);
