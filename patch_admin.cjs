const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

// Remove Leaflet imports
code = code.replace(/import 'leaflet\/dist\/leaflet\.css';\n/g, '');
code = code.replace(/import \{ MapContainer, TileLayer, CircleMarker, Popup, Polyline \} from 'react-leaflet';\n/g, '');

// Import APIProvider and Map from @vis.gl/react-google-maps
code = code.replace(
    "import { Button } from '@/components/ui/button';",
    "import { Button } from '@/components/ui/button';\nimport { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';"
);

// Map url
code = code.replace(/const mapUrl = .*\n/, '');

// Add GOOGLE_MAPS_API_KEY
code = code.replace(
    "export function AdminDashboard() {",
    "const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';\nexport function AdminDashboard() {"
);

// Replace MapContainer with APIProvider and Map
code = code.replace(
    /<MapContainer[\s\S]*?<\/MapContainer>/,
    `<APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                <Map
                  defaultCenter={{ lat: 22.5937, lng: 78.9629 }}
                  defaultZoom={5}
                  gestureHandling={'greedy'}
                  disableDefaultUI={true}
                  mapId="admin_dashboard_map"
                >
                  {/* High Donation Activity (Green) */}
                  {(activeLayer === 'all' || activeLayer === 'donations') && donations.filter(d => d.latitude && d.longitude && d.status !== 'requested' && d.status !== 'assigned').map((don) => (
                    <AdvancedMarker key={\`don-\${don.donation_id}\`} position={{ lat: don.latitude, lng: don.longitude }}>
                        <Pin background={'#10b981'} borderColor={'#065f46'} glyphColor={'#fff'} />
                    </AdvancedMarker>
                  ))}
                  
                  {/* Pending Pickups (Orange) */}
                  {(activeLayer === 'all' || activeLayer === 'pickups') && donations.filter(d => d.latitude && d.longitude && (d.status === 'requested' || d.status === 'assigned')).map((don) => (
                    <AdvancedMarker key={\`pen-\${don.donation_id}\`} position={{ lat: don.latitude, lng: don.longitude }}>
                         <Pin background={'#f97316'} borderColor={'#9a3412'} glyphColor={'#fff'} />
                    </AdvancedMarker>
                  ))}

                  {/* High Food Demand (Red) */}
                  {(activeLayer === 'all' || activeLayer === 'demand') && ngos.filter(n => n.latitude && n.longitude && n.pending_requests > 0).map((ngo) => (
                    <AdvancedMarker key={\`dem-\${ngo.ngo_id}\`} position={{ lat: ngo.latitude, lng: ngo.longitude }}>
                         <Pin background={'#ef4444'} borderColor={'#991b1b'} glyphColor={'#fff'} />
                    </AdvancedMarker>
                  ))}
                   
                  {/* Volunteers Live GPS (Blue dots) */}
                  {(activeLayer === 'all' || activeLayer === 'partners') && volunteers.filter(v => v.current_latitude && v.current_longitude && v.status === 'Available').map((vol) => (
                    <AdvancedMarker key={\`vol-\${vol.volunteer_id}\`} position={{ lat: vol.latitude, lng: vol.longitude }}>
                         <Pin background={'#3b82f6'} borderColor={'#1e40af'} glyphColor={'#fff'} scale={0.7} />
                    </AdvancedMarker>
                  ))}
                </Map>
               </APIProvider>`
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
