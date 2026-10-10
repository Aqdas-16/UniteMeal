import React, { useState, useEffect } from 'react';
import { Map, AdvancedMarker, Pin, useMap, useMapsLibrary, InfoWindow } from '@vis.gl/react-google-maps';
import { MapProvider as APIProvider } from '@/src/components/MapProvider';
import { supabase } from '@/lib/supabase';
import { Truck, MapPin, Building, ShieldCheck, Navigation, ExternalLink, Star } from 'lucide-react';
import { RestaurantRating } from '@/components/ui/RestaurantRating';
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
    if (routesLibrary.DirectionsService) {
        setDirectionsService(new routesLibrary.DirectionsService());
      }
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map }));
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || !origin || !destination) return;
    return; // Disabled due to missing Directions API
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
  const [selectedNgo, setSelectedNgo] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;
    const loadData = async () => {
       const { data: nData } = await supabase.from('ngos').select('*').eq('id', userId).maybeSingle();
       const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
       
       let lat = Number(nData?.location_lat || profileData?.latitude || 19.0760);
       let lng = Number(nData?.location_lng || profileData?.longitude || 72.8777);
       
       if (lat && lng && !isNaN(lat) && !isNaN(lng)) setNgoLoc({ lat, lng }); else setNgoLoc(null);
       
       const { data: allNgos } = await supabase.from('ngos').select('*').neq('id', userId);
       if (allNgos) setNgos(allNgos);
       
       const { data: allRests } = await supabase.from('restaurants').select('*, profiles!restaurants_user_id_fkey(avatar_url, full_name)');
       const { data: activeDonations } = await supabase.from('donations').select('*').eq('status', 'available');
       
       if (allRests) {
           const mappedRests = allRests.map(r => {
               const donations = activeDonations ? activeDonations.filter(d => d.restaurant_id === r.user_id || d.donor_id === r.user_id || d.restaurant_id === r.restaurant_id) : [];
               
               let distKm = 0;
               const dLatVal = Number(r.location_lat || r.latitude);
               const dLngVal = Number(r.location_lng || r.longitude);
               if (dLatVal && dLngVal && lat && lng) {
                   const R = 6371; 
                   const dLatRad = (dLatVal - lat) * Math.PI / 180;
                   const dLonRad = (dLngVal - lng) * Math.PI / 180;
                   const a = Math.sin(dLatRad/2) * Math.sin(dLatRad/2) + Math.cos(lat * Math.PI / 180) * Math.cos(dLatVal * Math.PI / 180) * Math.sin(dLonRad/2) * Math.sin(dLonRad/2);
                   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                   distKm = R * c;
               }
               
               return {
                   ...r,
                   location_lat: r.location_lat || r.latitude,
                   location_lng: r.location_lng || r.longitude,
                   business_name: r.business_name || r.profiles?.full_name || 'Restaurant',
                   avatar_url: r.profile_image_url || r.restaurant_logo_url || r.profiles?.avatar_url,
                   active_donations: donations,
                   distKm
               };
           });
           setRestaurants(mappedRests);
       }
       
       const { data: deliveries } = await supabase.from('deliveries')
           .select('*, profiles:volunteer_id(full_name)')
           .eq('ngo_id', userId)
           .in('status', ['accepted', 'heading_to_restaurant', 'arrived_restaurant', 'picked_up', 'heading_to_ngo', 'arrived_ngo']);
           
       if (deliveries && deliveries.length > 0) {
           const deliveryIds = deliveries.map(d => d.id);
           const { data: locs } = await supabase.from('delivery_locations')
               .select('*')
               .in('delivery_id', deliveryIds)
               .order('recorded_at', { ascending: false });
               
           const driverList = [];
           for (const d of deliveries) {
               const loc = locs?.find(l => l.delivery_id === d.id);
               if (loc) {
                   driverList.push({
                       deliveryId: d.id,
                       lat: loc.location_lat,
                       lng: loc.location_lng,
                       volunteer: { name: d.profiles?.full_name || 'Volunteer' },
                       status: d.status,
                       heading: loc.heading || 0
                   });
               }
           }
           setDrivers(driverList);
           setActiveDriver(driverList.length > 0 ? driverList[0] : null);
       } else {
           setDrivers([]);
           setActiveDriver(null);
       }
    };
    loadData();
    
    const channel = supabase.channel('tracking-live-map-ngo')
       .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_locations' }, () => { loadData(); })
       .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => { loadData(); })
       .subscribe();
       
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  if (!API_KEY) return <div className="p-4 text-center h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">Google Maps API Key not configured.</div>;
  if (!ngoLoc) return <div className="p-6 text-center h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl"><Navigation className="w-8 h-8 text-slate-300 mb-2" /><p className="font-semibold text-xs text-slate-900 dark:text-white">Location not set</p><p className="text-[11px] text-slate-500 mt-0.5">Please set your location in your Profile to view the live map.</p></div>;

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-100 dark:bg-[#111317]">
        <APIProvider apiKey={API_KEY}>
          <Map defaultCenter={ngoLoc} defaultZoom={13} mapId="NGO_LIVE_MAP" disableDefaultUI={true}>

             {/* Modern Sleek Legend */}
             <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-[#111317]/95 backdrop-blur-md rounded-xl shadow-sm p-3 border border-slate-200/80 dark:border-slate-800 z-10">
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Map Legend</h4>
                 <div className="space-y-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                     <div className="flex items-center gap-2.5">
                         <div className="w-3 h-3 rounded-full bg-blue-600 border border-white shadow-sm" />
                         <span>Your Hub</span>
                     </div>
                     <div className="flex items-center gap-2.5">
                         <div className="w-3 h-3 rounded-full bg-emerald-600 border border-white shadow-sm" />
                         <span>Restaurant Partner</span>
                     </div>
                     <div className="flex items-center gap-2.5">
                         <div className="w-3 h-3 rounded-full bg-purple-600 border border-white shadow-sm" />
                         <span>Active Volunteer</span>
                     </div>
                     <div className="flex items-center gap-2.5">
                         <div className="w-3 h-3 rounded-full bg-teal-500 border border-white shadow-sm" />
                         <span>Other NGOs</span>
                     </div>
                 </div>
             </div>

             {/* YOU - Blue */}
             <AdvancedMarker position={ngoLoc} zIndex={50}>
                <div className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-md relative group cursor-pointer">
                    <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20" />
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <div className="absolute top-full mt-1.5 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50">
                      Your Organization
                    </div>
                </div>
             </AdvancedMarker>
             
             {/* Other NGOs - Teal */}
             {ngos.filter(n => n.location_lat).map(n => (
                <AdvancedMarker key={n.id} position={{lat: Number(n.location_lat || 0), lng: Number(n.location_lng || 0)}} zIndex={30} onClick={() => setSelectedNgo(n)}>
                   <div className="w-6 h-6 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center shadow-sm group relative">
                      <Building className="w-3 h-3 text-white" />
                      <div className="absolute top-full mt-1.5 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50">
                          {n.business_name || n.name}
                      </div>
                   </div>
                </AdvancedMarker>
             ))}
             
             {/* Restaurants - Emerald */}
             {restaurants.filter(r => r.location_lat).map(r => {
                 const hasActive = r.active_donations && r.active_donations.length > 0;
                 return (
                    <AdvancedMarker key={r.restaurant_id || r.user_id} position={{lat: Number(r.location_lat || 0), lng: Number(r.location_lng || 0)}} zIndex={40} onClick={() => setSelectedRestaurant(r)}>
                        <div className={`w-7 h-7 rounded-full ${hasActive ? 'bg-emerald-600' : 'bg-emerald-400'} border-2 border-white flex items-center justify-center shadow-sm cursor-pointer hover:scale-105 transition-transform`}>
                           <MapPin className="w-3.5 h-3.5 text-white" />
                           {hasActive && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white" />
                           )}
                        </div>
                    </AdvancedMarker>
                 );
             })}
             
             {/* Drivers - Purple */}
             {drivers.map((d, i) => (
                <AdvancedMarker key={i} position={{lat: d.lat, lng: d.lng}} zIndex={60}>
                   <div className="w-9 h-9 rounded-full bg-purple-600 border-2 border-white flex items-center justify-center shadow-md relative cursor-pointer group">
                      <div className="absolute inset-0 rounded-full bg-purple-600 animate-ping opacity-30" />
                      <Truck className="w-4 h-4 text-white" />
                      <div className="absolute top-full mt-1.5 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50">
                          Volunteer Active
                      </div>
                   </div>
                </AdvancedMarker>
             ))}
             
             {/* InfoWindow for Restaurant */}
             {selectedRestaurant && (
                <InfoWindow
                    position={{lat: Number(selectedRestaurant.location_lat || 0), lng: Number(selectedRestaurant.location_lng || 0)}}
                    onCloseClick={() => setSelectedRestaurant(null)}
                    pixelOffset={[0, -15]}
                >
                   <div className="p-1 w-56 font-sans">
                       <div className="flex items-center gap-2.5 mb-2.5">
                           {selectedRestaurant.avatar_url ? (
                               <img src={selectedRestaurant.avatar_url} className="w-9 h-9 rounded-lg border border-slate-200 object-cover" alt="Avatar" />
                           ) : (
                               <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                                   <Building className="w-4 h-4 text-slate-400" />
                               </div>
                           )}
                           <div className="min-w-0">
                               <h3 className="font-bold text-[13px] text-slate-900 leading-tight truncate">{selectedRestaurant.business_name || selectedRestaurant.restaurant_name || selectedRestaurant.full_name}</h3>
                               <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500">
                                   <span className="font-semibold text-amber-600">★ 4.8</span>
                                   <span>•</span>
                                   <span>{selectedRestaurant.distKm?.toFixed(1)} km</span>
                               </div>
                           </div>
                       </div>
                       
                       <p className="text-[11px] text-slate-500 mb-2.5 flex items-start gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{selectedRestaurant.address || 'Address not provided'}</span>
                       </p>
                       
                       {selectedRestaurant.active_donations && selectedRestaurant.active_donations.length > 0 ? (
                           <div className="mb-2.5 p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                               <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">{selectedRestaurant.active_donations.length} Active Listing(s)</p>
                               <p className="text-[10px] text-emerald-600 dark:text-emerald-400 line-clamp-1 mt-0.5">{selectedRestaurant.active_donations.map((d: any) => d.title || d.food_name).join(', ')}</p>
                           </div>
                       ) : (
                           <div className="mb-2.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                               <p className="text-[11px] text-slate-500">No active donations</p>
                           </div>
                       )}
                       
                       <div className="flex gap-2">
                           <Button size="sm" variant="outline" className="flex-1 h-7 text-[11px] px-2" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedRestaurant.location_lat},${selectedRestaurant.location_lng}`, '_blank')}>
                               <Navigation className="w-3 h-3 mr-1" /> Directions
                           </Button>
                           <Button size="sm" className="flex-1 h-7 text-[11px] px-2 bg-[#059669] hover:bg-[#047857] text-white" onClick={() => navigate('/dashboard/ngo/incoming')}>
                               <ExternalLink className="w-3 h-3 mr-1" /> View
                           </Button>
                       </div>
                   </div>
                </InfoWindow>
             )}
             
             {/* InfoWindow for NGO */}
             {selectedNgo && (
                <InfoWindow
                    position={{lat: Number(selectedNgo.location_lat || 0), lng: Number(selectedNgo.location_lng || 0)}}
                    onCloseClick={() => setSelectedNgo(null)}
                    pixelOffset={[0, -15]}
                >
                   <div className="p-1 w-56 font-sans">
                       <div className="flex items-center gap-2.5 mb-2">
                           <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                               <Building className="w-4 h-4 text-slate-400" />
                           </div>
                           <div className="min-w-0">
                               <h3 className="font-bold text-[13px] text-slate-900 leading-tight truncate">{selectedNgo.organization_name || selectedNgo.business_name || selectedNgo.name}</h3>
                               <div className="text-[10px] text-[#059669] font-bold mt-0.5 uppercase tracking-wider">Partner NGO</div>
                           </div>
                       </div>
                       <p className="text-[11px] text-slate-500 flex items-start gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{selectedNgo.address || 'Address not provided'}</span>
                       </p>
                   </div>
                </InfoWindow>
             )}

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
           <div className="absolute top-4 right-4 bg-white/95 dark:bg-[#111317]/95 backdrop-blur-md p-3 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800 min-w-[130px]">
               <div className="flex items-center gap-1.5 mb-0.5">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Live ETA</h4>
               </div>
               <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{routeInfo.duration}</p>
               <p className="text-[11px] text-slate-500">{routeInfo.distance} away</p>
           </div>
       )}
    </div>
  );
}