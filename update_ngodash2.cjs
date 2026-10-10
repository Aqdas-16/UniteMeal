const fs = require('fs');
let code = fs.readFileSync('src/pages/NGODashboard.tsx', 'utf8');

const oldMap = `         <div className="relative w-full h-[500px] bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
             <div className="absolute inset-0 opacity-[0.85] z-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=19.0760,72.8777&zoom=14&size=1000x500&maptype=roadmap&style=feature:all|element:labels.text.fill|color:0x333333&style=feature:water|element:geometry|color:0xc8d7d4&style=feature:landscape|element:geometry|color:0xf5f5f2&style=feature:poi|element:geometry|color:0xeeeeee&style=feature:road.highway|element:geometry|color:0xf8c967&style=feature:road.arterial|element:geometry|color:0xe4d7c6&style=feature:road.local|element:geometry|color:0xffffff&key=YOUR_API_KEY_HERE')] bg-cover bg-center dark:invert dark:hue-rotate-180" />
             
             {/* Map Pins Simulation */}
             <div className="absolute z-10 w-full h-full">
                 <button className="absolute top-[40%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group focus:outline-none" onClick={() => setSelectedPin({ type: 'ngo', name: displayName })}>
                    <div className="bg-slate-900 text-white p-2 rounded-full shadow-xl border-4 border-white dark:border-[#111113] group-hover:scale-110 transition-transform">
                       <ShieldCheck className="w-5 h-5" />
                    </div>
                 </button>
                 
                 {aiMatches.map((m, i) => (
                     <button key={i} className="absolute flex flex-col items-center group focus:outline-none" style={{ top: \`\${30 + (i * 15)}%\`, left: \`\${60 - (i * 10)}%\` }} onClick={() => setSelectedPin({ type: 'donation', name: 'Grand Hotel Banquet', distance: '1.2 km', food: m.title || 'Mixed Food', qty: m.quantity_kg + ' kg', eta: '12 mins', match: m.matchScore })}>
                        <div className="bg-emerald-600 text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-[#111113] group-hover:scale-110 transition-transform animate-pulse">
                           <MapPin className="w-4 h-4" />
                        </div>
                     </button>
                 ))}
                 
                 {activePickups.map((p, i) => (
                     <button key={'p'+i} className="absolute flex flex-col items-center group focus:outline-none" style={{ top: \`\${20 + (i * 25)}%\`, left: \`\${30 + (i * 20)}%\` }} onClick={() => setSelectedPin({ type: 'driver', name: 'Rahul Sharma', distance: '3.4 km', eta: '14 mins', status: 'En Route to pickup' })}>
                        <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-[#111113] group-hover:scale-110 transition-transform">
                           <Bike className="w-4 h-4" />
                        </div>
                     </button>
                 ))}
             </div>`;

const newMap = `         <div className="relative w-full h-[500px] bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
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
            )}`;

code = code.replace(oldMap, newMap);
fs.writeFileSync('src/pages/NGODashboard.tsx', code);
