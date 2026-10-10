const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary, InfoWindow } from '@vis.gl/react-google-maps';
import { supabase } from '@/lib/supabase';
import { Truck, MapPin, Building, ShieldCheck, Navigation, ExternalLink, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

// Component to handle directions
function Directions({ origin, destination, setRouteInfo }: { origin: any, destination: any, setRouteInfo: (info: any) => void }) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();

  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map }));
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || !origin || !destination) return;

    directionsService.route({
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING
    }).then(response => {
      directionsRenderer.setDirections(response);
      const leg = response.routes[0].legs[0];
      setRouteInfo({
        distance: leg.distance?.text,
        duration: leg.duration?.text
      });
    }).catch(e => {
       console.error("Directions error", e);
    });
  }, [directionsService, directionsRenderer, origin, destination]);

  return null;
}

export function NGOLiveMap({ userId }: { userId: string | undefined }) {
  const navigate = useNavigate();
  const [ngoLoc, setNgoLoc] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [ngos, setNgos] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [activeDriver, setActiveDriver] = useState<any>(null);
  
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;
    const loadData = async () => {
       // Get current NGO
       const { data: nData } = await supabase.from('ngos').select('*').eq('id', userId).single();
       
       // Handle standard profiles fallback if NGO not fully in 'ngos' table yet (depends on schema setup)
       const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
       
       let lat = Number(nData?.location_lat || profileData?.location_lat || 19.0760);
       let lng = Number(nData?.location_lng || profileData?.location_lng || 72.8777);
       
       setNgoLoc({ lat, lng });
       
       // Other NGOs
       const { data: allNgos } = await supabase.from('profiles').select('*').eq('role', 'ngo').neq('id', userId);
       if (allNgos) setNgos(allNgos);
       
       // Restaurants with active donations
       const { data: rests } = await supabase.from('profiles').select('*, donations(*)').eq('role', 'restaurant');
       
       if (rests) {
          // Calculate distance and available donations
          const restsProcessed = rests.map(r => {
              const active = r.donations?.filter((d: any) => d.status === 'available') || [];
              let distKm = 0;
              if (r.location_lat && r.location_lng) {
                 const R = 6371; 
                 const dLat = (Number(r.location_lat) - lat) * Math.PI / 180;
                 const dLon = (Number(r.location_lng) - lng) * Math.PI / 180;
                 const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat * Math.PI / 180) * Math.cos(Number(r.location_lat) * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2); 
                 const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
                 distKm = R * c; 
              }
              return { ...r, active_donations: active, distKm };
          });
          setRestaurants(restsProcessed);
       }
       
       // Drivers
       const { data: tasks } = await supabase.from('pickup_tasks').select('id, restaurant_id').eq('ngo_id', userId).in('status', ['on_the_way', 'arrived', 'picked_up']);
       if (tasks && tasks.length > 0) {
          const taskIds = tasks.map((t: any) => t.id);
          const { data: tracks } = await supabase.from('tracking_locations')
            .select('*, pickup_tasks(*)')
            .in('pickup_task_id', taskIds);
            
          if (tracks && tracks.length > 0) {
              const latestTracks = tracks.reduce((acc: any, curr: any) => {
                  if (!acc[curr.pickup_task_id] || new Date(curr.updated_at) > new Date(acc[curr.pickup_task_id].updated_at)) {
                      acc[curr.pickup_task_id] = curr;
                  }
                  return acc;
              }, {});
              const driverList = Object.values(latestTracks).map((t: any) => ({
                 lat: Number(t.latitude),
                 lng: Number(t.longitude),
                 restaurantId: t.pickup_tasks.restaurant_id,
                 taskId: t.pickup_task_id
              }));
              setDrivers(driverList);
              if (driverList.length > 0) {
                 setActiveDriver(driverList[0]);
              }
          }
       }
    };
    loadData();
    
    const channel = supabase.channel('tracking-live-map-ngo')
       .on('postgres_changes', { event: '*', schema: 'public', table: 'tracking_locations' }, () => {
          loadData();
       })
       .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => {
          loadData();
       })
       .subscribe();
       
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  if (!API_KEY) return <div className="p-4 text-center h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">Google Maps API Key not configured.</div>;
  if (!ngoLoc) return <div className="p-4 text-center h-full flex items-center justify-center">Loading map...</div>;

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden">
       <APIProvider apiKey={API_KEY}>
          <Map defaultCenter={ngoLoc} defaultZoom={13} mapId="NGO_LIVE_MAP" disableDefaultUI={true}>
             {/* YOU - Blue */}
             <AdvancedMarker position={ngoLoc} zIndex={50}>
                <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-lg relative group cursor-pointer">
                   <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20" />
                   <ShieldCheck className="w-5 h-5 text-white" />
                   <div className="absolute top-full mt-2 bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50">
                      Your Organization
                   </div>
                </div>
             </AdvancedMarker>
             
             {/* Other NGOs - Green */}
             {ngos.filter(n => n.location_lat).map(n => (
                <AdvancedMarker key={n.id} position={{lat: Number(n.location_lat), lng: Number(n.location_lng)}} zIndex={30}>
                   <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow group relative">
                      <Building className="w-3 h-3 text-white" />
                      <div className="absolute top-full mt-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50">
                          {n.business_name || n.name}
                      </div>
                   </div>
                </AdvancedMarker>
             ))}
             
             {/* Restaurants - Orange */}
             {restaurants.filter(r => r.location_lat).map(r => {
                 const hasActive = r.active_donations && r.active_donations.length > 0;
                 return (
                    <AdvancedMarker key={r.id} position={{lat: Number(r.location_lat), lng: Number(r.location_lng)}} zIndex={40} onClick={() => setSelectedRestaurant(r)}>
                       <div className={\`w-8 h-8 rounded-full \${hasActive ? 'bg-orange-500' : 'bg-slate-400'} border-2 border-white flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform\`}>
                          <MapPin className="w-4 h-4 text-white" />
                          {hasActive && (
                             <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
                          )}
                       </div>
                    </AdvancedMarker>
                 );
             })}
             
             {/* Drivers - Purple moving marker */}
             {drivers.map((d, i) => (
                <AdvancedMarker key={i} position={{lat: d.lat, lng: d.lng}} zIndex={60}>
                   <div className="w-10 h-10 rounded-full bg-purple-600 border-2 border-white flex items-center justify-center shadow-lg relative cursor-pointer group">
                      <div className="absolute inset-0 rounded-full bg-purple-600 animate-ping opacity-30" />
                      <Truck className="w-5 h-5 text-white" />
                      <div className="absolute top-full mt-2 bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50">
                         Volunteer Active
                      </div>
                   </div>
                </AdvancedMarker>
             ))}
             
             {/* InfoWindow for Restaurant */}
             {selectedRestaurant && (
                <InfoWindow
                   position={{lat: Number(selectedRestaurant.location_lat), lng: Number(selectedRestaurant.location_lng)}}
                   onCloseClick={() => setSelectedRestaurant(null)}
                   pixelOffset={[0, -20]}
                >
                   <div className="p-1 w-64">
                       <div className="flex items-center gap-3 mb-3">
                           {selectedRestaurant.avatar_url ? (
                               <img src={selectedRestaurant.avatar_url} className="w-10 h-10 rounded-full border border-slate-200 object-cover" />
                           ) : (
                               <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                   <Building className="w-5 h-5 text-slate-400" />
                               </div>
                           )}
                           <div>
                               <h3 className="font-bold text-sm text-slate-900 leading-tight line-clamp-1">{selectedRestaurant.business_name || selectedRestaurant.restaurant_name || selectedRestaurant.full_name}</h3>
                               <div className="flex items-center gap-1 mt-0.5">
                                   <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                   <span className="text-xs font-medium text-slate-700">4.8</span>
                                   <span className="text-xs text-slate-400 mx-1">•</span>
                                   <span className="text-xs text-slate-500">{selectedRestaurant.distKm?.toFixed(1)} km</span>
                               </div>
                           </div>
                       </div>
                       
                       <p className="text-xs text-slate-500 mb-3 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{selectedRestaurant.address || 'Address not provided'}</span>
                       </p>
                       
                       {selectedRestaurant.active_donations && selectedRestaurant.active_donations.length > 0 ? (
                           <div className="mb-3 p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                               <p className="text-xs font-bold text-emerald-800 mb-1">{selectedRestaurant.active_donations.length} Active Donation(s)</p>
                               <p className="text-[10px] text-emerald-600 line-clamp-1">{selectedRestaurant.active_donations.map((d: any) => d.title || d.food_name).join(', ')}</p>
                           </div>
                       ) : (
                           <div className="mb-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
                               <p className="text-xs text-slate-500">No active donations</p>
                           </div>
                       )}
                       
                       <div className="flex gap-2">
                           <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px] px-2" onClick={() => window.open(\`https://www.google.com/maps/dir/?api=1&destination=\${selectedRestaurant.location_lat},\${selectedRestaurant.location_lng}\`, '_blank')}>
                               <Navigation className="w-3 h-3 mr-1" /> Directions
                           </Button>
                           <Button size="sm" className="flex-1 h-8 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate('/dashboard/ngo/incoming')}>
                               <ExternalLink className="w-3 h-3 mr-1" /> View
                           </Button>
                       </div>
                   </div>
                </InfoWindow>
             )}
             
             {/* Directions */}
             {activeDriver && (
                <Directions 
                   origin={{lat: activeDriver.lat, lng: activeDriver.lng}} 
                   destination={ngoLoc} 
                   setRouteInfo={setRouteInfo} 
                />
             )}
          </Map>
       </APIProvider>
       
       {routeInfo && (
           <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-200 min-w-[150px]">
               <div className="flex items-center gap-2 mb-1">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Live ETA</h4>
               </div>
               <p className="text-xl font-bold text-slate-900 mt-1">{routeInfo.duration}</p>
               <p className="text-xs text-slate-500 font-medium">{routeInfo.distance} away</p>
           </div>
       )}
    </div>
  );
}
`

fs.writeFileSync('src/components/dashboard/NGOLiveMap.tsx', code);
