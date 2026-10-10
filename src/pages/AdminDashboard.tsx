import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '../components/theme-provider';
import { Button } from '@/components/ui/button';
import { Map as GoogleMap, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { MapProvider as APIProvider } from '@/src/components/MapProvider';
import { 
  Radio, Box, Truck, ShieldCheck, Map, Activity, 
  ArrowUpRight, Building2, Users2, PackageCheck, AlertCircle 
} from 'lucide-react';
import { AdminNGOVerificationContent } from './AdminFeatures';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export function AdminDashboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [donors, setDonors] = useState<any[]>([]);
  const [ngos, setNgos] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [activeLayer, setActiveLayer] = useState<'all' | 'donations' | 'pickups' | 'demand' | 'partners'>('all');
  
  const [volunteersTable, setVolunteersTable] = useState<any[]>([]);
  const [ngosTable, setNgosTable] = useState<any[]>([]);
  const [restaurantsTable, setRestaurantsTable] = useState<any[]>([]);

  useEffect(() => {
     const fetchProfiles = async () => {
        const { data } = await supabase.from('profiles').select('*');
        if (data) {
           setDonors(data.filter(p => p.role === 'donor'));
           setNgos(data.filter(p => p.role === 'ngo'));
           setVolunteers(data.filter(p => p.role === 'volunteer'));
        }
     };

     const fetchDonations = async () => {
        const { data } = await supabase.from('donations').select('*');
        if (data) setDonations(data);
     };

     const fetchDeliveries = async () => {
        const { data } = await supabase.from('deliveries').select('*');
        if (data) setDeliveries(data);
     };

     const fetchVolunteersTableData = async () => {
        const { data } = await supabase.from('volunteers').select('*');
        if (data) setVolunteersTable(data);
     };
     const fetchNgosTableData = async () => {
        const { data } = await supabase.from('ngos').select('*');
        if (data) setNgosTable(data);
     };
     const fetchRestaurantsTableData = async () => {
        const { data } = await supabase.from('restaurants').select('*');
        if (data) setRestaurantsTable(data);
     };
     
     fetchProfiles();
     fetchDonations();
     fetchDeliveries();
     fetchVolunteersTableData();
     fetchNgosTableData();
     fetchRestaurantsTableData();

     const channelP = supabase.channel('admin-profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchProfiles()).subscribe();
     const channelDo = supabase.channel('admin-donations').on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => fetchDonations()).subscribe();
     const channelDe = supabase.channel('admin-deliveries').on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, () => fetchDeliveries()).subscribe();
     const channelV = supabase.channel('admin-volunteers').on('postgres_changes', { event: '*', schema: 'public', table: 'volunteers' }, () => fetchVolunteersTableData()).subscribe();
     const channelN = supabase.channel('admin-ngos-tbl').on('postgres_changes', { event: '*', schema: 'public', table: 'ngos' }, () => fetchNgosTableData()).subscribe();
     const channelR = supabase.channel('admin-rests-tbl').on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => fetchRestaurantsTableData()).subscribe();

     return () => {
        supabase.removeChannel(channelP);
        supabase.removeChannel(channelDo);
        supabase.removeChannel(channelDe);
        supabase.removeChannel(channelV);
        supabase.removeChannel(channelN);
        supabase.removeChannel(channelR);
     };
  }, []);

  useEffect(() => {
    const all: any[] = [];
    donations.slice(0, 15).forEach(x => {
      if (x.created_at) all.push({ id: `d_${x.donation_id || x.id}`, type: 'donation', title: `New Contribution Created`, desc: `Food Contributor created donation: ${x.title} (${x.quantity_kg}kg)`, date: new Date(x.created_at), status: 'live' });
    });
    deliveries.slice(0, 15).forEach(x => {
      if (x.created_at) all.push({ id: `v_${x.id || x.id}`, type: 'delivery', title: `Active Delivery Updates`, desc: `Rider assigned to dropoff ID #${x.id?.substring(0, 5) || '..'}`, date: new Date(x.created_at), status: 'in transit' });
    });
    ngosTable.slice(0, 5).forEach(x => {
      if (x.created_at) all.push({ id: `n_${x.ngo_id || x.id}`, type: 'ngo', title: `System Event: NGO Verified`, desc: `${x.organization_name} joined the network.`, date: new Date(x.created_at), status: 'verified' });
    });
    
    all.sort((a,b) => b.date.getTime() - a.date.getTime());
    setActivityFeed(all.slice(0, 12));
  }, [donations, deliveries, ngosTable]);

  const activeDeliveriesCount = deliveries.filter(d => !['delivered', 'cancelled'].includes(d.status)).length;
  const pendingRequestsCount = donations.filter(d => ['requested', 'pending'].includes(d.status)).length;
  const liveDonationsCount = donations.filter(d => !['delivered', 'cancelled'].includes(d.status)).length;
  const onlineRidersCount = volunteersTable.filter(v => v.status === 'Available').length;

  return (
    <main className="min-h-[calc(100dvh-64px)] w-full bg-[#FAFAFA] dark:bg-[#0A0A0A] font-sans px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
      <div className="max-w-[1500px] mx-auto w-full space-y-6">
        
        {/* EXECUTIVE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111113] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] flex items-center justify-center font-bold border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
               <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-extrabold text-slate-900 dark:text-white tracking-tight">Global Command Center</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Live Telemetry
                </span>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Real-time nationwide platform oversight, logistics routing, and verification.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Time</p>
                <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">{new Date().toLocaleTimeString()}</p>
             </div>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
          {[
            { label: 'Live Donations', value: liveDonationsCount, icon: Box, border: 'border-l-blue-500' },
            { label: 'Pending Pickup', value: pendingRequestsCount, icon: AlertCircle, border: 'border-l-amber-500' },
            { label: 'Active Deliveries', value: activeDeliveriesCount, icon: Truck, border: 'border-l-emerald-500' },
            { label: 'Online Riders', value: onlineRidersCount, icon: Users2, border: 'border-l-indigo-500' },
            { label: 'Verified NGOs', value: ngosTable.length, icon: Building2, border: 'border-l-purple-500' },
            { label: 'Contributors', value: restaurantsTable.length, icon: PackageCheck, border: 'border-l-rose-500' },
            { label: 'Network Health', value: '99.9%', icon: ShieldCheck, border: 'border-l-emerald-600' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <div className={`bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 ${stat.border} border-l-4 rounded-xl p-4 shadow-sm flex flex-col justify-between h-full`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">{stat.label}</p>
                    <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                  <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* VERIFICATION SECTION */}
        <div className="bg-white dark:bg-[#111113] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5 sm:p-6">
            <AdminNGOVerificationContent />
        </div>

        {/* MAP & EVENT FEED SPLIT */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-stretch">
          
          {/* MAIN GOOGLE MAP */}
          <div className="xl:col-span-3 bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[580px]">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0A0A0A]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-[#059669]" />
                <h3 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">Live Nationwide Operations Map</h3>
              </div>
              
              <div className="flex flex-wrap items-center gap-1.5">
                 {[
                   { id: 'all', label: 'All Layers' },
                   { id: 'donations', label: 'Donations' },
                   { id: 'pickups', label: 'Pickups' },
                   { id: 'demand', label: 'Demand' },
                   { id: 'partners', label: 'Online Riders' },
                 ].map(layer => (
                   <Button 
                      key={layer.id}
                      variant={activeLayer === layer.id ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setActiveLayer(layer.id as any)}
                      className={`h-7 px-3 text-[11px] font-bold ${activeLayer === layer.id ? 'bg-[#059669] hover:bg-[#047857] text-white shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111113] text-slate-600 dark:text-slate-300'}`}
                   >
                     {layer.label}
                   </Button>
                 ))}
              </div>
            </div>

            <div className="flex-1 relative w-full h-full bg-slate-100 dark:bg-slate-900">
               <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  defaultCenter={{ lat: 22.5937, lng: 78.9629 }}
                  restriction={{ latLngBounds: { north: 35.5, south: 6.5, east: 97.5, west: 68.0 }, strictBounds: true }}
                  defaultZoom={5}
                  gestureHandling={'cooperative'}
                  disableDefaultUI={true}
                  mapId="admin_dashboard_map"
                  className="w-full h-full"
                >
                  {/* NGOs (Green) */}
                  {(activeLayer === 'all') && ngosTable.filter(n => n.location_lat && n.location_lng && n.is_verified).map((ngo) => (
                    <AdvancedMarker key={`ngo-${ngo.id}`} position={{ lat: ngo.location_lat, lng: ngo.location_lng }}>
                         <Pin background={'#059669'} borderColor={'#047857'} glyphColor={'#fff'} />
                    </AdvancedMarker>
                  ))}
                  
                  {/* Restaurants (Red) */}
                  {(activeLayer === 'all') && restaurantsTable.filter(r => r.location_lat && r.location_lng && r.verification_status === 'verified').map((rest) => (
                    <AdvancedMarker key={`rest-${rest.restaurant_id}`} position={{ lat: rest.location_lat, lng: rest.location_lng }}>
                         <Pin background={'#ef4444'} borderColor={'#991b1b'} glyphColor={'#fff'} />
                    </AdvancedMarker>
                  ))}

                  {/* High Donation Activity (Green) */}
                  {(activeLayer === 'donations') && donations.filter(d => d.latitude && d.longitude && d.status !== 'requested' && d.status !== 'assigned').map((don) => (
                    <AdvancedMarker key={`don-${don.donation_id}`} position={{ lat: don.latitude, lng: don.longitude }}>
                        <Pin background={'#059669'} borderColor={'#047857'} glyphColor={'#fff'} />
                    </AdvancedMarker>
                  ))}
                  
                  {/* Pending Pickups (Orange) */}
                  {(activeLayer === 'all' || activeLayer === 'pickups') && donations.filter(d => d.latitude && d.longitude && (d.status === 'requested' || d.status === 'assigned')).map((don) => (
                    <AdvancedMarker key={`pen-${don.donation_id}`} position={{ lat: don.latitude, lng: don.longitude }}>
                         <Pin background={'#f59e0b'} borderColor={'#b45309'} glyphColor={'#fff'} />
                    </AdvancedMarker>
                  ))}

                  {/* High Food Demand (Red) */}
                  {(activeLayer === 'demand') && ngosTable.filter(n => n.location_lat && n.location_lng && n.pending_requests > 0).map((ngo) => (
                    <AdvancedMarker key={`dem-${ngo.id}`} position={{ lat: ngo.location_lat, lng: ngo.location_lng }}>
                         <Pin background={'#ef4444'} borderColor={'#991b1b'} glyphColor={'#fff'} />
                    </AdvancedMarker>
                  ))}
                   
                  {/* Volunteers Live GPS (Blue dots) */}
                  {(activeLayer === 'all' || activeLayer === 'partners') && volunteersTable.filter(v => v.current_latitude && v.current_longitude && v.status === 'Available').map((vol) => (
                    <AdvancedMarker key={`vol-${vol.id}`} position={{ lat: vol.current_latitude, lng: vol.current_longitude }}>
                         <Pin background={'#3b82f6'} borderColor={'#1d4ed8'} glyphColor={'#fff'} scale={0.7} />
                    </AdvancedMarker>
                  ))}
                </GoogleMap>
               </APIProvider>
            </div>
          </div>

          {/* LIVE EVENT FEED */}
          <div className="xl:col-span-1 bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[580px]">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0A0A0A]/50 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-2">
                 <Activity className="w-4 h-4 text-[#059669]" />
                 <h3 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">Live Event Stream</h3>
               </div>
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                {activityFeed.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-[13px] h-full flex items-center justify-center">
                      Waiting for global system activities...
                    </div>
                ) : (
                    activityFeed.map((item) => (
                        <div key={item.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-[#16181D] transition-colors flex gap-3">
                            <div className="mt-0.5 shrink-0">
                                {item.type === 'donation' && <Box className="w-4 h-4 text-amber-500" />}
                                {item.type === 'delivery' && <Truck className="w-4 h-4 text-blue-500" />}
                                {item.type === 'ngo' && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{item.title}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.desc}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-1.5">{item.date.toLocaleTimeString()}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
