const fs = require('fs');
let code = fs.readFileSync('src/pages/TrackDeliveriesContent.tsx', 'utf8');

code = code.replace(
    /const origin = \{ lat: Number\(selectedDelivery\.donations\?\.pickup_lat \|\| selectedDelivery\.restaurant\?\.location_lat \|\| selectedDelivery\.restaurant\?\.latitude\), lng: Number\(selectedDelivery\.donations\?\.pickup_lng \|\| selectedDelivery\.restaurant\?\.location_lng \|\| selectedDelivery\.restaurant\?\.longitude\) \};/,
    'const origin = { lat: Number(selectedDelivery.donations?.pickup_lat || selectedDelivery.restaurant?.location_lat || selectedDelivery.restaurant?.latitude || 19.0760), lng: Number(selectedDelivery.donations?.pickup_lng || selectedDelivery.restaurant?.location_lng || selectedDelivery.restaurant?.longitude || 72.8777) };'
);

code = code.replace(
    /const dest = \{ lat: Number\(selectedDelivery\.ngo\?\.location_lat \|\| selectedDelivery\.ngo\?\.latitude\), lng: Number\(selectedDelivery\.ngo\?\.location_lng \|\| selectedDelivery\.ngo\?\.longitude\) \};/,
    'const dest = { lat: Number(selectedDelivery.ngo?.location_lat || selectedDelivery.ngo?.latitude || 19.0760), lng: Number(selectedDelivery.ngo?.location_lng || selectedDelivery.ngo?.longitude || 72.8777) };'
);

code = code.replace(
    /defaultCenter=\{\{ lat: Number\(selectedDelivery\.ngo\?\.location_lat \|\| selectedDelivery\.ngo\?\.latitude\), lng: Number\(selectedDelivery\.ngo\?\.location_lng \|\| selectedDelivery\.ngo\?\.longitude\) \}\}/,
    'defaultCenter={{ lat: Number(selectedDelivery.ngo?.location_lat || selectedDelivery.ngo?.latitude || 19.0760), lng: Number(selectedDelivery.ngo?.location_lng || selectedDelivery.ngo?.longitude || 72.8777) }}'
);

code = code.replace(
    /position=\{\{ lat: Number\(selectedDelivery\.donations\?\.pickup_lat \|\| selectedDelivery\.restaurant\?\.location_lat \|\| selectedDelivery\.restaurant\?\.latitude\), lng: Number\(selectedDelivery\.donations\?\.pickup_lng \|\| selectedDelivery\.restaurant\?\.location_lng \|\| selectedDelivery\.restaurant\?\.longitude\) \}\}/,
    'position={{ lat: Number(selectedDelivery.donations?.pickup_lat || selectedDelivery.restaurant?.location_lat || selectedDelivery.restaurant?.latitude || 19.0760), lng: Number(selectedDelivery.donations?.pickup_lng || selectedDelivery.restaurant?.location_lng || selectedDelivery.restaurant?.longitude || 72.8777) }}'
);

code = code.replace(
    /position=\{\{ lat: Number\(selectedDelivery\.ngo\?\.location_lat \|\| selectedDelivery\.ngo\?\.latitude\), lng: Number\(selectedDelivery\.ngo\?\.location_lng \|\| selectedDelivery\.ngo\?\.longitude\) \}\}/,
    'position={{ lat: Number(selectedDelivery.ngo?.location_lat || selectedDelivery.ngo?.latitude || 19.0760), lng: Number(selectedDelivery.ngo?.location_lng || selectedDelivery.ngo?.longitude || 72.8777) }}'
);

fs.writeFileSync('src/pages/TrackDeliveriesContent.tsx', code);
