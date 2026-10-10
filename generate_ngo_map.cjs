const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary, InfoWindow } from '@vis.gl/react-google-maps';
import { supabase } from '@/lib/supabase';
import { Truck, MapPin, Building, ShieldCheck } from 'lucide-react';

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
  const [ngoLoc, setNgoLoc] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [ngos, setNgos] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [activeDriver, setActiveDriver] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;
    const loadData = async () => {
       const { data: nData } = await supabase.from('ngos').select('*').eq('id', userId).single();
       if (nData && nData.location_lat && nData.location_lng) {
          setNgoLoc({ lat: Number(nData.location_lat), lng: Number(nData.location_lng) });
       } else {
          setNgoLoc({ lat: 19.0760, lng: 72.8777 }); // Default
       }
       
       const { data: allNgos } = await supabase.from('ngos').select('*').neq('id', userId);
       if (allNgos) setNgos(allNgos);
       
       const { data: rests } = await supabase.from('restaurants').select('*');
       if (rests) setRestaurants(rests);
       
       // Get tracking locations for current NGO's assigned pickups
       const { data: tasks } = await supabase.from('pickup_tasks').select('id, restaurant_id').eq('ngo_id', userId).eq('status', 'on_route');
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
                 lat: Number(t.location_lat),
                 lng: Number(t.location_lng),
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
    
    // Subscribe to tracking_locations
    const channel = supabase.channel('tracking-live-map')
       .on('postgres_changes', { event: '*', schema: 'public', table: 'tracking_locations' }, () => {
          loadData();
       }).subscribe();
       
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  if (!API_KEY) return <div className="p-4 text-center">Google Maps API Key not configured.</div>;
  if (!ngoLoc) return <div className="p-4 text-center">Loading map...</div>;

  return (
    <div className="relative w-full h-full">
       <APIProvider apiKey={API_KEY}>
          <Map defaultCenter={ngoLoc} defaultZoom={13} mapId="NGO_LIVE_MAP" disableDefaultUI={true}>
             {/* YOU - Blue */}
             <AdvancedMarker position={ngoLoc}>
                <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-lg">
                   <ShieldCheck className="w-4 h-4 text-white" />
                </div>
             </AdvancedMarker>
             
             {/* Other NGOs - Green */}
             {ngos.filter(n => n.location_lat).map(n => (
                <AdvancedMarker key={n.id} position={{lat: Number(n.location_lat), lng: Number(n.location_lng)}}>
                   <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow">
                      <Building className="w-3 h-3 text-white" />
                   </div>
                </AdvancedMarker>
             ))}
             
             {/* Restaurants - Orange */}
             {restaurants.filter(r => r.location_lat).map(r => (
                <AdvancedMarker key={r.id || r.restaurant_id || r.user_id} position={{lat: Number(r.location_lat), lng: Number(r.location_lng)}}>
                   <div className="w-6 h-6 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center shadow">
                      <MapPin className="w-3 h-3 text-white" />
                   </div>
                </AdvancedMarker>
             ))}
             
             {/* Drivers - Purple moving marker */}
             {drivers.map((d, i) => (
                <AdvancedMarker key={i} position={{lat: d.lat, lng: d.lng}}>
                   <div className="w-8 h-8 rounded-full bg-purple-600 border-2 border-white flex items-center justify-center shadow-lg z-50">
                      <Truck className="w-4 h-4 text-white animate-pulse" />
                   </div>
                </AdvancedMarker>
             ))}
             
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
           <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md border border-slate-200">
               <h4 className="font-bold text-sm text-slate-800">Active Delivery ETA</h4>
               <p className="text-xs text-slate-600 font-medium mt-1">{routeInfo.duration} <span className="text-slate-400">({routeInfo.distance})</span></p>
           </div>
       )}
    </div>
  );
}
`;
fs.writeFileSync('src/components/dashboard/NGOLiveMap.tsx', code);
