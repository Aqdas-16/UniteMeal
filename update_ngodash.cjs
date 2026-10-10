const fs = require('fs');
let code = fs.readFileSync('src/pages/NGODashboard.tsx', 'utf8');

// Add import for map
code = code.replace(
  "import { Link, useNavigate } from 'react-router-dom';",
  "import { Link, useNavigate } from 'react-router-dom';\nimport { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';\n\nconst API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || '';"
);

// We need to fetch NGO profile to get their lat/lng
const fetchReplacement = `    const fetchDonations = async () => {
        const { data: donations } = await supabase.from('donations').select('*');
        if (!donations) return;
        
        const { data: ngoData } = await supabase.from('ngos').select('location_lat, location_lng').eq('id', user.uid).maybeSingle();
        const ngoLat = ngoData?.location_lat || 19.0760;
        const ngoLng = ngoData?.location_lng || 72.8777;
        setNgoLocation({ lat: parseFloat(ngoLat as any), lng: parseFloat(ngoLng as any) });
        
        const available = donations.filter((d: any) => d.status === 'available');
        const active = donations.filter((d: any) => ['assigned', 'picked_up'].includes(d.status) && d.ngo_id === user.uid);
        
        const { calculateDistance } = await import('@/lib/ai-engine');
        
        const aiRecommended = available.map((d: any) => {
            const dist = calculateDistance(ngoLat, ngoLng, d.pickup_lat || ngoLat, d.pickup_lng || ngoLng);
            let score = 95 - (dist * 2);
            if (score < 40) score = 40;
            return {
               ...d,
               matchScore: Math.floor(score)
            }
        }).sort((a: any, b: any) => b.matchScore - a.matchScore).slice(0, 5);
        
        setAiMatches(aiRecommended);
        setActivePickups(active);`;

code = code.replace(/    const fetchDonations = async \(\) => \{[\s\S]*?setAiMatches\(aiRecommended\);/m, fetchReplacement);

const mapReplacement = `         <div className="relative w-full h-[500px] bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
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
            
            {/* Info overlay (selectedPin) */}`;

code = code.replace(/         <div className="relative w-full h-\[500px\][\s\S]*?\{\/\* Info overlay \(selectedPin\) \*\/\}/m, mapReplacement);

// We need to add state for ngoLocation
code = code.replace(/  const \[selectedPin, setSelectedPin\] = useState<any>\(null\);/, "  const [selectedPin, setSelectedPin] = useState<any>(null);\n  const [ngoLocation, setNgoLocation] = useState<any>(null);");

fs.writeFileSync('src/pages/NGODashboard.tsx', code);
