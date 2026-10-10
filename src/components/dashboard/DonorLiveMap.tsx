import { useEffect, useState, useRef } from 'react';
import { Map, AdvancedMarker, Pin, useMap, useMapsLibrary, InfoWindow } from '@vis.gl/react-google-maps';
import { MapProvider as APIProvider } from '@/src/components/MapProvider';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, Truck, ShieldCheck, Activity, Maximize, Minimize } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RestaurantRating } from '@/components/ui/RestaurantRating';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || '';


const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
};

export function DonorLiveMap({ userId }: { userId: string | undefined }) {
  const { user, profile } = useAuth();
  
  const [youLoc, setYouLoc] = useState<google.maps.LatLngLiteral | null>(null);
  const [youData, setYouData] = useState<any>(null);
  
  const [ngos, setNgos] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [activeDonations, setActiveDonations] = useState<any[]>([]);
  
  const [drivers, setDrivers] = useState<any[]>([]);
  
  const [mapError, setMapError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [infoWindowOpen, setInfoWindowOpen] = useState<string | null>(null);
  
  const role = profile?.role; // 'donor' or 'ngo'
  const isNGO = role === 'ngo';
  const isRest = role === 'donor';

  useEffect(() => {
    if (!user || !role) {
       // Clear state if no user or role changes
       setYouLoc(null);
       setYouData(null);
       setNgos([]);
       setRestaurants([]);
       setDrivers([]);
       return;
    }
    
    // FETCH YOU
    const fetchYou = async () => {
       if (isRest) {
          const { data } = await supabase.from('restaurants').select('*').eq('user_id', user.uid).maybeSingle();
          if (data) {
             setYouData(data);
             if (data.latitude && data.longitude) {
                 setYouLoc({ lat: Number(data.latitude), lng: Number(data.longitude) });
             } else if (data.location_lat && data.location_lng) {
                 setYouLoc({ lat: Number(data.location_lat), lng: Number(data.location_lng) });
             }
          }
       } else if (isNGO) {
          const { data } = await supabase.from('ngos').select('*').eq('id', user.uid).maybeSingle();
          if (data) {
             setYouData(data);
             if (data.location_lat && data.location_lng) {
                 setYouLoc({ lat: Number(data.location_lat), lng: Number(data.location_lng) });
             }
          }
       }
    };
    
    // FETCH NGOs (Both roles need this: NGOs see *other* NGOs, Restaurants see *all* nearby NGOs)
    const fetchNgos = async () => {
       const { data } = await supabase.from('ngos').select('*');
       if (data) {
          setNgos(data);
       }
    };
    // FETCH RESTAURANTS (Only NGO login sees this)
    const fetchRestaurants = async () => {
       const { data: rests } = await supabase.from('restaurants').select('*');
       const { data: donations } = await supabase.from('donations').select('*').in('status', ['available', 'pending acceptance']);
       if (rests) {
          setRestaurants(rests);
       }
       if (donations) {
          setActiveDonations(donations);
       }
    };
    // FETCH DRIVERS (Tracking locations for active tasks)
    const fetchDrivers = async () => {
        // Fetch deliveries
        const { data: deliveries } = await supabase
            .from('deliveries')
            .select('*, donations!inner(donor_id), volunteers(id), profiles:volunteer_id(full_name)')
            .in('status', ['accepted', 'heading_to_restaurant', 'arrived_restaurant', 'picked_up', 'heading_to_ngo', 'arrived_ngo'])
            .eq(isRest ? 'donations.donor_id' : 'ngo_id', user.uid);
            
        if (deliveries && deliveries.length > 0) {
            const deliveryIds = deliveries.map(d => d.id);
            const { data: locs } = await supabase.from('delivery_locations')
                .select('*')
                .in('delivery_id', deliveryIds)
                .order('recorded_at', { ascending: false });
                
            const driverLocs = [];
            for (const d of deliveries) {
                const loc = locs?.find(l => l.delivery_id === d.id);
                if (loc) {
                    driverLocs.push({
                        id: d.id,
                        lat: loc.location_lat,
                        lng: loc.location_lng,
                        restaurant_id: d.donations?.donor_id,
                        ngo_id: d.ngo_id,
                        volunteer: { name: d.profiles?.full_name || 'Volunteer' },
                        status: d.status,
                        heading: loc.heading || 0
                    });
                }
            }
            setDrivers(driverLocs);
        } else {
            setDrivers([]);
        }
    };

    fetchYou();
    fetchNgos();
    fetchRestaurants();
    fetchDrivers();
    
    // Realtime subscriptions
    const channels = [
        supabase.channel('public:ngos').on('postgres_changes', { event: '*', schema: 'public', table: 'ngos' }, () => { fetchYou(); fetchNgos(); }).subscribe(),
        supabase.channel('public:restaurants').on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => { fetchYou(); fetchRestaurants(); }).subscribe(),
        supabase.channel('public:donations').on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => { fetchRestaurants(); }).subscribe(),
        supabase.channel('public:tracking').on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_locations' }, () => { fetchDrivers(); }).subscribe(),
        supabase.channel('public:tasks').on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, () => { fetchDrivers(); }).subscribe()
    ];
    
    return () => {
       channels.forEach(c => supabase.removeChannel(c));
    };
  }, [user, role]);

  const hasValidKey = Boolean(API_KEY) && !API_KEY.includes('YOUR_') && API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY';

  if (!hasValidKey) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-slate-50 dark:bg-[#111113] rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="text-center space-y-4 p-8 max-w-lg">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
             <MapPin className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Google Maps API Key Required</h2>
        </div>
      </div>
    );
  }

  return (
    <>
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]" onClick={() => setIsFullscreen(false)} />
      )}
      <div className={isFullscreen ? "fixed inset-2 md:inset-8 z-[100] flex flex-col bg-white dark:bg-[#111113] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all" : "relative h-[600px] w-full flex flex-col"}>
        <CardHeader className="p-5 md:p-6 border-b dark:border-slate-800 z-10 flex flex-row items-center justify-between bg-white dark:bg-[#111113]">
        <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <MapPin className="w-5 h-5 text-indigo-500" /> Live Operations Center
            </CardTitle>
            <CardDescription className="text-xs mt-1 font-medium text-slate-500">Real-time driver routing & NGO monitoring</CardDescription>
        </div>
        <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 mr-4">
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></div> You</span>
                
                {isRest && <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-purple-600"></div> NGOs</span>}
                {isNGO && <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-purple-600"></div> NGOs</span>}
                
                {restaurants.filter(r => !isRest || (r.user_id !== user?.uid && r.id !== user?.uid)).length > 0 && <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-amber-500"></div> Restaurants</span>}
                
                {drivers.length > 0 && <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500"></div> Volunteer</span>}
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400 font-bold px-3 py-1 animate-pulse hidden sm:flex">
              ● Live Status
            </Badge>
        </div>
      </CardHeader>
      
      <div className="flex-1 relative z-0 w-full h-full bg-slate-100 dark:bg-[#0a0a0a]">
        <button
            onClick={() => setIsFullscreen(!isFullscreen)}
           className="absolute top-4 right-4 z-10 bg-white dark:bg-slate-800 p-2 rounded-md shadow-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
           title={isFullscreen ? "Minimize map" : "Expand map"}
        >
           {isFullscreen ? <Minimize className="w-5 h-5 text-slate-700" /> : <Maximize className="w-5 h-5 text-slate-700" />}
        </button>
        <APIProvider 
           apiKey={API_KEY} 
           version="weekly"
          onError={(e) => {
             console.error("Google Maps API Loading Error:", e);
             setMapError("Unable to load Google Maps.");
          }}
        >
          {mapError ? (
             <div className="absolute inset-0 flex items-center justify-center z-50 p-6 text-center">
                <div className="text-red-500 font-medium flex flex-col items-center">
                   <Activity className="w-8 h-8 mx-auto mb-2" />
                   <p>{mapError}</p>
                   <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-indigo-700">Retry</button>
                </div>
             </div>
          ) : (!youLoc && isLoading) ? (
             <div className="absolute inset-0 flex items-center justify-center z-50 bg-slate-100 dark:bg-[#0a0a0a]">
                <div className="text-slate-500 font-medium flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-indigo-500 animate-spin"></div>
                   Loading map...
                </div>
             </div>
          ) : (
            <Map
            defaultCenter={youLoc || { lat: 20.5937, lng: 78.9629 }}
            defaultZoom={youLoc ? 13 : 5}
            mapId="DONOR_MAP_ID"
            disableDefaultUI={true}
            zoomControl={true}
            gestureHandling={isFullscreen ? "greedy" : "none"}
          >
            {/* 1. YOU MARKER */}
            {youLoc && (
              <>
              <AdvancedMarker position={youLoc} title={youData?.business_name || youData?.organization_name || "You"} onClick={() => setInfoWindowOpen('you')}>
                <div className="bg-indigo-600 w-9 h-9 rounded-full border-[3px] border-white shadow-xl flex items-center justify-center relative z-50">
                   <MapPin className="w-4 h-4 text-white" />
                   <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
              </AdvancedMarker>
              
              {infoWindowOpen === 'you' && (
                 <InfoWindow position={youLoc} onCloseClick={() => setInfoWindowOpen(null)}>
                    <div className="p-2 max-w-[200px] text-slate-900">
                       <h3 className="font-bold text-sm mb-1">{youData?.business_name || youData?.organization_name || "Your Location"}</h3>
                       {youData && (youData.role === "donor" || youData.role === "restaurant") && <div className="my-1"><RestaurantRating donorId={youData.id || youData.user_id || youData.restaurant_id} /></div>}
                       <p className="text-xs text-slate-600">{youData?.address || "Address not available"}</p>
                    </div>
                 </InfoWindow>
              )}
              </>
            )}

            {/* 2. NGOs MARKERS */}
            {ngos.filter(n => (n.location_lat && n.location_lng) && (!isNGO || n.id !== user?.uid)).map(ngo => (
              <div key={ngo.id}>
              <AdvancedMarker position={{ lat: Number(ngo.location_lat || 0), lng: Number(ngo.location_lng || 0) }} title={ngo.organization_name} onClick={() => setInfoWindowOpen(ngo.id)}>
                 <div className="bg-purple-600 w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                 </div>
              </AdvancedMarker>
              
              {infoWindowOpen === ngo.id && (
                 <InfoWindow position={{ lat: Number(ngo.location_lat || 0), lng: Number(ngo.location_lng || 0) }} onCloseClick={() => setInfoWindowOpen(null)}>
                    <div className="p-2 max-w-[220px] text-slate-900">
                       <h3 className="font-bold text-sm mb-1">{ngo.organization_name}</h3>
                       <p className="text-xs text-slate-600 mb-2">{ngo.address}</p>
                       <div className="flex gap-2">
                           <Badge variant="outline" className="text-[10px]">Cap: {ngo.capacity_people || 'N/A'}</Badge>
                           <Badge variant="outline" className="text-[10px]">Vols: Active</Badge>
                           {youLoc && <Badge variant="outline" className="text-[10px]">{getDistance(youLoc.lat, youLoc.lng, Number(ngo.location_lat || 0), Number(ngo.location_lng || 0))} km</Badge>}
                       </div>
                    </div>
                 </InfoWindow>
              )}
              </div>
            ))}
            
            {/* 3. RESTAURANTS MARKERS (NGO View Only) */}
            {restaurants.filter(r => ((r.location_lat && r.location_lng) || (r.latitude && r.longitude)) && (!isRest || (r.user_id !== user?.uid && r.id !== user?.uid))).map(rest => {
               const rId = rest.id || rest.user_id || rest.restaurant_id;
               const restDonations = activeDonations.filter(d => d.restaurant_id === rId || d.donor_id === rId);
               
               return (
                  <div key={rId}>
                  <AdvancedMarker position={{ lat: Number(rest.location_lat || rest.latitude), lng: Number(rest.location_lng || rest.longitude) }} title={rest.business_name} onClick={() => setInfoWindowOpen(rId)}>
                     <div className="bg-amber-500 w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                        <MapPin className="w-3.5 h-3.5 text-white" />
                     </div>
                  </AdvancedMarker>
                  
                  {infoWindowOpen === rId && (
                     <InfoWindow position={{ lat: Number(rest.location_lat || rest.latitude), lng: Number(rest.location_lng || rest.longitude) }} onCloseClick={() => setInfoWindowOpen(null)}>
                        <div className="p-2 max-w-[220px] text-slate-900">
                           <h3 className="font-bold text-sm mb-1">{rest.business_name || rest.organization_name}</h3>
                           <div className="my-1"><RestaurantRating donorId={rId} /></div>
                           <p className="text-xs text-slate-600 mb-2">{rest.address}</p>
                           {youLoc && <p className="text-xs text-slate-500 mb-2">{getDistance(youLoc.lat, youLoc.lng, Number(rest.location_lat || rest.latitude), Number(rest.location_lng || rest.longitude))} km away</p>}
                           <p className="text-xs font-bold text-slate-800 mb-1">Available Donations:</p>
                           <ul className="text-xs text-slate-600 pl-4 list-disc">
                               {restDonations.map(d => (
                                   <li key={d.id}>{d.title || d.food_category} ({d.quantity_kg || 0}kg) - <span className="font-medium text-emerald-600 capitalize">{d.status.replace('_', ' ')}</span></li>
                               ))}
                           </ul>
                           <a href={`/dashboard/ngo/restaurants/${rId}`} className="mt-3 block text-center text-xs bg-indigo-50 text-indigo-700 font-bold py-1.5 rounded hover:bg-indigo-100 transition-colors">
                              View Profile
                           </a>
                        </div>
                     </InfoWindow>
                  )}
                  </div>
               );
            })}

            {/* 4. VOLUNTEER DRIVERS */}
            {drivers.map(driver => (
              <div key={driver.id}>
              <AdvancedMarker position={{ lat: driver.lat, lng: driver.lng }} title={driver.ngo_volunteers?.name || "Driver"} onClick={() => setInfoWindowOpen(driver.id)}>
                 <div className="bg-blue-600 w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center relative">
                    <Truck className="w-4 h-4 text-white" />
                 </div>
              </AdvancedMarker>
              
              {infoWindowOpen === driver.id && (
                 <InfoWindow position={{ lat: driver.lat, lng: driver.lng }} onCloseClick={() => setInfoWindowOpen(null)}>
                    <div className="p-2 max-w-[200px] text-slate-900">
                       <h3 className="font-bold text-sm mb-1">{driver.ngo_volunteers?.name || "Volunteer"}</h3>
                       <p className="text-xs text-slate-600">Status: {driver.status}</p>
                    </div>
                 </InfoWindow>
              )}
              </div>
            ))}
          </Map>
          )}
        </APIProvider>
      </div>
      </div>
    </>
  );
}
