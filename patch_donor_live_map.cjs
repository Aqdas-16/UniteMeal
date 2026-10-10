const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DonorLiveMap.tsx', 'utf8');

// The ngos filter currently filters out user?.uid indiscriminately
// We should only filter out user?.uid if the current role is NGO (isNGO)
// Or simply always show all NGOs to a Restaurant. 
// "isNGO" is defined in DonorLiveMap as: const isNGO = role === 'ngo';
// So let's replace the filter

let targetNgos = "{ngos.filter(n => (n.location_lat && n.location_lng) && n.id !== user?.uid).map(ngo => (";
let replacementNgos = "{ngos.filter(n => (n.location_lat && n.location_lng) && (!isNGO || n.id !== user?.uid)).map(ngo => (";

code = code.replace(targetNgos, replacementNgos);

// Also need to make the NGO color purple
// Change "bg-emerald-500" to "bg-purple-600" for NGOs MARKERS
let targetNgoMarker = `<div className="bg-emerald-500 w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />`;
let replacementNgoMarker = `<div className="bg-purple-600 w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />`;

code = code.replace(targetNgoMarker, replacementNgoMarker);

// Also change the legend for NGOs
let targetLegend = `{isRest && <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div> NGO</span>}
                {isNGO && <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div> NGOs</span>}`;
let replacementLegend = `{isRest && <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-purple-600"></div> NGOs</span>}
                {isNGO && <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-purple-600"></div> NGOs</span>}`;

code = code.replace(targetLegend, replacementLegend);

fs.writeFileSync('src/components/dashboard/DonorLiveMap.tsx', code);
