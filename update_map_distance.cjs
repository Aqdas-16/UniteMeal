const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DonorLiveMap.tsx', 'utf-8');

const haversine = `
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
};
`;

code = code.replace("export function DonorLiveMap", haversine + "\nexport function DonorLiveMap");

// For NGOs
code = code.replace(
    `                           <Badge variant="outline" className="text-[10px]">Cap: {ngo.capacity_people || 'N/A'}</Badge>`,
    `                           <Badge variant="outline" className="text-[10px]">Cap: {ngo.capacity_people || 'N/A'}</Badge>\n                           {youLoc && <Badge variant="outline" className="text-[10px]">{getDistance(youLoc.lat, youLoc.lng, Number(ngo.location_lat), Number(ngo.location_lng))} km</Badge>}`
);

// For Restaurants
code = code.replace(
    `<p className="text-xs font-bold text-slate-800 mb-1">Available Donations:</p>`,
    `{youLoc && <p className="text-xs text-slate-500 mb-2">{getDistance(youLoc.lat, youLoc.lng, Number(rest.location_lat), Number(rest.location_lng))} km away</p>}
                           <p className="text-xs font-bold text-slate-800 mb-1">Available Donations:</p>`
);

fs.writeFileSync('src/components/dashboard/DonorLiveMap.tsx', code);
