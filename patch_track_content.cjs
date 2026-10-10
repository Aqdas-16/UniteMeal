const fs = require('fs');
let code = fs.readFileSync('src/pages/TrackDeliveriesContent.tsx', 'utf8');

// Replace origin and dest in useEffect
code = code.replace(
    /const origin = \{ lat: Number\(selectedDelivery\.restaurant\.latitude \|\| selectedDelivery\.restaurant\.location_lat\), lng: Number\(selectedDelivery\.restaurant\.longitude \|\| selectedDelivery\.restaurant\.location_lng\) \};/,
    'const origin = { lat: Number(selectedDelivery.donations?.pickup_lat || selectedDelivery.restaurant?.location_lat || selectedDelivery.restaurant?.latitude), lng: Number(selectedDelivery.donations?.pickup_lng || selectedDelivery.restaurant?.location_lng || selectedDelivery.restaurant?.longitude) };'
);

code = code.replace(
    /const dest = \{ lat: Number\(selectedDelivery\.ngo\.latitude\), lng: Number\(selectedDelivery\.ngo\.longitude\) \};/,
    'const dest = { lat: Number(selectedDelivery.ngo?.location_lat || selectedDelivery.ngo?.latitude), lng: Number(selectedDelivery.ngo?.location_lng || selectedDelivery.ngo?.longitude) };'
);

// Replace defaultCenter
code = code.replace(
    /defaultCenter=\{\{ lat: Number\(selectedDelivery\.ngo\.latitude\), lng: Number\(selectedDelivery\.ngo\.longitude\) \}\}/,
    'defaultCenter={{ lat: Number(selectedDelivery.ngo?.location_lat || selectedDelivery.ngo?.latitude), lng: Number(selectedDelivery.ngo?.location_lng || selectedDelivery.ngo?.longitude) }}'
);

// Replace Restaurant Marker
code = code.replace(
    /<AdvancedMarker position=\{\{ lat: Number\(selectedDelivery\.restaurant\.latitude \|\| selectedDelivery\.restaurant\.location_lat\), lng: Number\(selectedDelivery\.restaurant\.longitude \|\| selectedDelivery\.restaurant\.location_lng\) \}\}>/,
    '<AdvancedMarker position={{ lat: Number(selectedDelivery.donations?.pickup_lat || selectedDelivery.restaurant?.location_lat || selectedDelivery.restaurant?.latitude), lng: Number(selectedDelivery.donations?.pickup_lng || selectedDelivery.restaurant?.location_lng || selectedDelivery.restaurant?.longitude) }}>'
);

// Replace NGO Marker
code = code.replace(
    /<AdvancedMarker position=\{\{ lat: Number\(selectedDelivery\.ngo\.latitude\), lng: Number\(selectedDelivery\.ngo\.longitude\) \}\}>/,
    '<AdvancedMarker position={{ lat: Number(selectedDelivery.ngo?.location_lat || selectedDelivery.ngo?.latitude), lng: Number(selectedDelivery.ngo?.location_lng || selectedDelivery.ngo?.longitude) }}>'
);

// Also fix the fetchDeliveries fallback
code = code.replace(
    /const \{ data: pData \} = await supabase\.from\('profiles'\)\.select\('\*'\)\.eq\('id', d\.donations\.donor_id\)\.maybeSingle\(\);/,
    'const { data: pData } = await supabase.from(\'donors\').select(\'*\').eq(\'id\', d.donations.donor_id).maybeSingle();'
);

fs.writeFileSync('src/pages/TrackDeliveriesContent.tsx', code);
