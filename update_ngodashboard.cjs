const fs = require('fs');
let code = fs.readFileSync('src/pages/NGODashboard.tsx', 'utf8');

const startIndex = code.indexOf('<div className="relative w-full h-[500px]');
const endIndex = code.indexOf('</div>', code.indexOf('</button>', startIndex) + 2000); // just find a good end or replace the whole block

// It's safer to just split at '<div className="relative w-full h-[500px]"' and replace until the next '{/* NGO Selection Panel */}'

const startSplit = code.indexOf('<div className="relative w-full h-[500px]');
const endSplit = code.indexOf('{/* NGO Selection Panel */}');

if (startSplit !== -1 && endSplit !== -1) {
  const newMap = `<div className="relative w-full h-[500px] bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
            {(Boolean(API_KEY) && !API_KEY.includes('YOUR_')) ? (
              <APIProvider apiKey={API_KEY} version="weekly">
                 <Map
                    defaultCenter={ngoLocation || { lat: 19.0760, lng: 72.8777 }}
                    defaultZoom={12}
                    mapId="NGO_MAP_ID"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    style={{ width: '100%', height: '100%' }}
                    disableDefaultUI={true}
                    zoomControl={true}
                 >
                    {ngoLocation && (
                       <AdvancedMarker position={ngoLocation} title={displayName} onClick={() => setSelectedPin({ type: 'ngo', name: displayName })}>
                           <div className="bg-slate-900 text-white p-2 rounded-full shadow-xl border-4 border-white dark:border-[#111113] cursor-pointer hover:scale-110 transition-transform">
                              <ShieldCheck className="w-5 h-5" />
                           </div>
                       </AdvancedMarker>
                    )}
                    {aiMatches.filter(m => m.pickup_lat && m.pickup_lng).map((m, i) => (
                       <AdvancedMarker key={i} position={{ lat: parseFloat(m.pickup_lat), lng: parseFloat(m.pickup_lng) }} title={m.title} onClick={() => setSelectedPin({ type: 'donation', name: m.title || 'Donation', distance: 'Calculated', food: m.title || 'Mixed Food', qty: m.quantity_kg + ' kg', eta: 'N/A', match: m.matchScore })}>
                           <div className="bg-emerald-600 text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-[#111113] cursor-pointer hover:scale-110 transition-transform animate-pulse">
                              <MapPin className="w-4 h-4" />
                           </div>
                       </AdvancedMarker>
                    ))}
                 </Map>
              </APIProvider>
            ) : (
               <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-[#111113]">
                  <p className="text-slate-500">Map API key missing. Please configure VITE_GOOGLE_MAPS_API_KEY.</p>
               </div>
            )}
         </div>
         
         `;
         
  code = code.substring(0, startSplit) + newMap + code.substring(endSplit);
  fs.writeFileSync('src/pages/NGODashboard.tsx', code);
}
