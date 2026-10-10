const fs = require('fs');

function patchMap(file) {
    let code = fs.readFileSync(file, 'utf8');
    // Replace Number(expr) with Number(expr || 0) if it's inside lat: or lng:
    // Only doing a few specific ones
    code = code.replace(/Number\(ngo\.location_lat\)/g, 'Number(ngo.location_lat || 0)');
    code = code.replace(/Number\(ngo\.location_lng\)/g, 'Number(ngo.location_lng || 0)');
    code = code.replace(/Number\(n\.location_lat\)/g, 'Number(n.location_lat || 0)');
    code = code.replace(/Number\(n\.location_lng\)/g, 'Number(n.location_lng || 0)');
    code = code.replace(/Number\(r\.location_lat\)/g, 'Number(r.location_lat || 0)');
    code = code.replace(/Number\(r\.location_lng\)/g, 'Number(r.location_lng || 0)');
    code = code.replace(/Number\(selectedRestaurant\.location_lat\)/g, 'Number(selectedRestaurant.location_lat || 0)');
    code = code.replace(/Number\(selectedRestaurant\.location_lng\)/g, 'Number(selectedRestaurant.location_lng || 0)');
    fs.writeFileSync(file, code);
}

patchMap('src/components/dashboard/DonorLiveMap.tsx');
patchMap('src/components/dashboard/NGOLiveMap.tsx');

