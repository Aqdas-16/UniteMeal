const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DonorLiveMap.tsx', 'utf8');

// Filter out You from ngos
code = code.replace(
    "{ngos.filter(n => n.location_lat && n.location_lng).map(ngo => (",
    "{ngos.filter(n => (n.location_lat && n.location_lng) && n.id !== user?.uid).map(ngo => ("
);

// Filter out You from restaurants
code = code.replace(
    "{restaurants.filter(r => (r.location_lat && r.location_lng) || (r.latitude && r.longitude)).map(rest => {",
    "{restaurants.filter(r => ((r.location_lat && r.location_lng) || (r.latitude && r.longitude)) && r.user_id !== user?.uid && r.id !== user?.uid).map(rest => {"
);

// Add "Other Restaurants" to legend if isRest wants to see them (currently only NGO has it, but let's add it universally if restaurants > 1 or isNGO)
code = code.replace(
    "{isNGO && restaurants.length > 0 && <span className=\"flex items-center gap-1.5\"><div className=\"w-2.5 h-2.5 rounded-sm bg-blue-600\"></div> Restaurants</span>}",
    "{restaurants.filter(r => r.user_id !== user?.uid && r.id !== user?.uid).length > 0 && <span className=\"flex items-center gap-1.5\"><div className=\"w-2.5 h-2.5 rounded-sm bg-amber-500\"></div> Restaurants</span>}"
);

fs.writeFileSync('src/components/dashboard/DonorLiveMap.tsx', code);
