import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Navigation, Bike, Activity, Maximize, Minimize } from 'lucide-react';
import { Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapProvider as APIProvider } from '@/src/components/MapProvider';
import { Badge } from '@/components/ui/badge';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

// Component to draw the route
function RouteDisplay({ origin, destination }: { origin: {lat: number, lng: number}, destination: {lat: number, lng: number} }) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map) return;
    // Clear previous route
    polylinesRef.current.forEach(p => p.setMap(null));

    routesLib.Route.computeRoutes({
      origin,
      destination,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'] }).then(({ routes }) => {
      if (routes?.[0]) {
        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach((p: google.maps.Polyline) => p.setMap(map));
        polylinesRef.current = newPolylines;
        if (routes[0].viewport) map.fitBounds(routes[0].viewport);
      }
    }).catch(e => {
       console.error("Google Maps Route error: ", e);
    });

    return () => polylinesRef.current.forEach(p => p.setMap(null));
  }, [routesLib, map, origin, destination]);

  return null;
}

export function LiveTrackingMap({ deliveryId }: { deliveryId: string }) {
  const [ngoLoc, setNgoLoc] = useState({ lat: 19.0760, lng: 72.8777 }); 
  const [riderLoc, setRiderLoc] = useState<{lat: number, lng: number} | null>(null);
  const [eta, setEta] = useState('Pending');
  const [distance, setDistance] = useState('Pending');
  const [mapError, setMapError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!deliveryId) return;

    const fetchDetails = async () => {
      try {
        const { data: delivery } = await supabase.from('deliveries').select('*').eq('id', deliveryId).single();
        if (delivery && delivery.ngo_id) {
           const { data: ngo } = await supabase.from('ngos').select('*').eq('id', delivery.ngo_id).single();
           if (ngo && ngo.latitude && ngo.longitude) {
              setNgoLoc({ lat: parseFloat(ngo.latitude), lng: parseFloat(ngo.longitude) });
           }
        }
      } catch (e) {
        console.error("Error fetching delivery details:", e);
      }
    };

    fetchDetails();

    const fetchLocation = async () => {
        const { data: locs } = await supabase.from('delivery_locations')
            .select('*')
            .eq('delivery_id', deliveryId)
            .order('recorded_at', { ascending: false })
            .limit(1);
        if (locs && locs.length > 0) {
            const loc = locs[0];
            if (loc.location_lat && loc.location_lng) {
              setRiderLoc({ lat: parseFloat(loc.location_lat), lng: parseFloat(loc.location_lng) });
              setEta(loc.eta || 'Updating...');
              setDistance(loc.distance || 'Updating...');
            }
        }
    };

    fetchLocation();
    
    const channel = supabase.channel('live-tracking')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'delivery_locations', filter: `delivery_id=eq.${deliveryId}` }, () => fetchLocation())
        .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [deliveryId]);

  if (!API_KEY) {
    console.error("Google Maps Error: VITE_GOOGLE_MAPS_API_KEY environment variable is missing.");
    return (
      <div className="h-[400px] flex items-center justify-center bg-slate-50 dark:bg-theme-surface rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="text-center space-y-2 p-6">
          <MapPin className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-slate-900 dark:text-white font-bold">Maps Offline</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Please add your VITE_GOOGLE_MAPS_API_KEY to your environment variables to enable live tracking and routing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]" onClick={() => setIsFullscreen(false)} />
      )}
      <div className={isFullscreen ? "fixed inset-2 md:inset-8 z-[100] flex flex-col bg-white dark:bg-theme-surface rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all" : "relative w-full h-[400px] bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800"}>
        <button 
           onClick={() => setIsFullscreen(!isFullscreen)}
           className="absolute top-4 right-4 z-10 bg-white dark:bg-slate-800 p-2 rounded-md shadow-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
           title={isFullscreen ? "Minimize map" : "Expand map"}
        >
           {isFullscreen ? <Minimize className="w-5 h-5 text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white" /> : <Maximize className="w-5 h-5 text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white" />}
        </button>

       <APIProvider 
         apiKey={API_KEY} 
         version="weekly"
         onError={(e) => {
            console.error("Google Maps API Loading Error:", e);
            setMapError("Failed to load Google Maps. Please check your API key and console for details.");
         }}
       >
         {mapError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-theme-surface z-50 p-6 text-center">
               <div className="text-red-500 font-medium">
                  <Activity className="w-8 h-8 mx-auto mb-2" />
                  <p>{mapError}</p>
               </div>
            </div>
         ) : (
           <Map
             defaultCenter={ngoLoc}
             defaultZoom={12}
             mapId="TRACKING_MAP_ID"
             internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
             style={{ width: '100%', height: '100%' }}
             disableDefaultUI={true}
             zoomControl={true}
             streetViewControl={isFullscreen}
             mapTypeControl={isFullscreen}
             fullscreenControl={false}
             gestureHandling={isFullscreen ? "greedy" : "none"}
           >
             {/* NGO Destination Marker */}
             <AdvancedMarker position={ngoLoc} title="Destination (NGO)">
               <div className="bg-slate-900 dark:bg-slate-100 w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 shadow-xl flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white dark:text-slate-900" />
               </div>
             </AdvancedMarker>

             {/* Volunteer Marker */}
             {riderLoc && (
               <AdvancedMarker position={riderLoc} title="Volunteer En Route">
                  <div className="bg-emerald-600 w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center relative">
                     <Bike className="w-4 h-4 text-white" />
                  </div>
               </AdvancedMarker>
             )}

             {/* Route Display */}
             {riderLoc && (
               <RouteDisplay origin={riderLoc} destination={ngoLoc} />
             )}
           </Map>
         )}
       </APIProvider>

       <div className="absolute top-4 left-4 right-4 z-10 flex justify-between gap-4 pointer-events-none">
          <div className="bg-white/90 dark:bg-black/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center gap-4 pointer-events-auto transition-transform hover:scale-105">
            <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full text-blue-600 dark:text-blue-400">
               <Navigation className="w-5 h-5" />
            </div>
            <div>
               <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">ETA</p>
               <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">{eta}</p>
            </div>
          </div>
          <div className="bg-white/90 dark:bg-black/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center gap-4 pointer-events-auto transition-transform hover:scale-105">
            <div>
               <p className="text-xs flex justify-end text-slate-500 uppercase tracking-widest font-bold">Distance</p>
               <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">{distance}</p>
            </div>
          </div>
       </div>
    </div>
    </>
  );
}
