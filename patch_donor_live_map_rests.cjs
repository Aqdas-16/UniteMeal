const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DonorLiveMap.tsx', 'utf8');

// The restaurants filter currently filters out user?.uid indiscriminately
// We should only filter out user?.uid if the current role is Restaurant (isRest)

let targetRests = "{restaurants.filter(r => ((r.location_lat && r.location_lng) || (r.latitude && r.longitude)) && r.user_id !== user?.uid && r.id !== user?.uid).map(rest => {";
let replacementRests = "{restaurants.filter(r => ((r.location_lat && r.location_lng) || (r.latitude && r.longitude)) && (!isRest || (r.user_id !== user?.uid && r.id !== user?.uid))).map(rest => {";
code = code.replace(targetRests, replacementRests);

let targetRestsLegend = "{restaurants.filter(r => r.user_id !== user?.uid && r.id !== user?.uid).length > 0 && <span className=\"flex items-center gap-1.5\"><div className=\"w-2.5 h-2.5 rounded-sm bg-amber-500\"></div> Restaurants</span>}";
let replacementRestsLegend = "{restaurants.filter(r => !isRest || (r.user_id !== user?.uid && r.id !== user?.uid)).length > 0 && <span className=\"flex items-center gap-1.5\"><div className=\"w-2.5 h-2.5 rounded-sm bg-amber-500\"></div> Restaurants</span>}";
code = code.replace(targetRestsLegend, replacementRestsLegend);

fs.writeFileSync('src/components/dashboard/DonorLiveMap.tsx', code);
