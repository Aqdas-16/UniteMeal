import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, CheckCircle2, Clock, MapPin, Truck, Box, History,
  ArrowRight, Users, Heart, Building, Maximize2, Minimize2, Utensils, Bell
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { NGOLiveMap } from '../components/dashboard/NGOLiveMap';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Footer } from '../components/layout/Footer';
import { AssignVolunteerModal } from '../components/dashboard/AssignVolunteerModal';
import { DonationDetailsModal } from '../components/dashboard/DonationDetailsModal';
import { RestaurantRating } from '@/components/ui/RestaurantRating';

function ActionCard({ title, desc, icon: Icon, onClick }: { title: string, desc: string, icon: any, onClick: () => void }) {
  return (
    <Card className="hover:shadow-sm transition-all cursor-pointer border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111113] hover:border-emerald-500/40 group rounded-xl shadow-sm" onClick={onClick}>
      <CardContent className="p-4 flex items-center justify-between">
         <div className="flex items-center gap-3.5 min-w-0">
             <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                 <Icon className="w-5 h-5" />
             </div>
             <div className="min-w-0">
                 <h3 className="font-semibold text-sm text-slate-900 dark:text-white truncate">{title}</h3>
                 <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{desc}</p>
             </div>
         </div>
         <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 ml-3 group-hover:translate-x-1 transition-transform" />
      </CardContent>
    </Card>
  );
}

function KPICard({ label, value, icon: Icon }: { label: string, value: string, icon: any }) {
  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111113] shadow-sm rounded-xl">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
          <p className="text-xl font-bold mt-0.5 text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
      </CardContent>
    </Card>
  );
}

export function NGOHomepage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [availableDonations, setAvailableDonations] = useState<any[]>([]);
  const [mealsRescued, setMealsRescued] = useState(0);
  const [pickupsCompleted, setPickupsCompleted] = useState(0);
  const [nearbyRestaurants, setNearbyRestaurants] = useState(0);
  const [volunteerCount, setVolunteerCount] = useState(0);
  const [todayPickups, setTodayPickups] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [assigningDonation, setAssigningDonation] = useState<any>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [viewingDonation, setViewingDonation] = useState<any>(null);
  
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMapFullscreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const fetchDashboardData = async () => {
        const { data: available } = await supabase.from('donations')
               .select('*, profiles!donations_restaurant_id_fkey(full_name, avatar_url, phone_number, address, latitude, longitude), donation_images(image_url)')
               .eq('status', 'available')
               .gt('expiry_time', new Date().toISOString())
               .order('created_at', { ascending: false });
        if (available) setAvailableDonations(available.slice(0, 3));

        const { data: myTasks } = await supabase.from('deliveries')
          .select('*, donations(quantity_kg, estimated_meals), volunteers(profiles(full_name))')
          .eq('ngo_id', user.uid);
          
        const { count: vols } = await supabase.from('volunteers').select('*', { count: 'exact', head: true }).eq('ngo_id', user.uid);
        if (vols !== null) setVolunteerCount(vols);
        
        const { count: restCount } = await supabase.from('restaurants').select('*', { count: 'exact', head: true });
        if (restCount !== null) setNearbyRestaurants(restCount);
        
        if (myTasks) {
            const today = new Date().toISOString().split('T')[0];
            const tasksToday = myTasks.filter(t => t.created_at?.startsWith(today));
            setTodayPickups(tasksToday.length);
            
            const completed = myTasks.filter(t => t.status === 'completed');
            setPickupsCompleted(completed.length);
            
            let meals = 0;
            completed.forEach(t => {
                if (t.donations?.estimated_meals) {
                    meals += Number(t.donations.estimated_meals);
                }
            });
            setMealsRescued(meals);
            
            const activities = myTasks
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                .slice(0, 4)
                .map(t => {
                    const statusText = t.status.replace(/_/g, ' ');
                    return {
                        id: t.id,
                        title: `Donation ${statusText}`,
                        desc: `Vol: ${t.volunteers?.profiles?.full_name || 'Unassigned'}`,
                        time: t.updated_at,
                        icon: statusText === 'completed' ? CheckCircle2 : (statusText.includes('on the way') ? Truck : Clock),
                        bg: statusText === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-blue-50 dark:bg-blue-900/20',
                        color: statusText === 'completed' ? 'text-emerald-500' : 'text-blue-500'
                    };
                });
            setRecentActivity(activities);
        }
    };
    
    fetchDashboardData();
    
    const channel = supabase.channel('ngo_dashboard_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, fetchDashboardData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries', filter: `ngo_id=eq.${user.uid}` }, fetchDashboardData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteers', filter: `ngo_id=eq.${user.uid}` }, fetchDashboardData)
        .subscribe();
        
    return () => {
        supabase.removeChannel(channel);
    };
  }, [user]);

  const calculateDistance = (lat: number, lng: number) => {
      return (Math.random() * 5 + 1).toFixed(1);
  };

  return (
    <div className="flex flex-col w-full font-sans bg-[#F8F9F6] dark:bg-[#0A0A0A] min-h-screen">
      {viewingDonation && <DonationDetailsModal isOpen={!!viewingDonation} onClose={() => setViewingDonation(null)} donation={viewingDonation} onAccept={() => { setViewingDonation(null); setAssigningDonation(viewingDonation); }} ngoLoc={{ lat: profile?.latitude || 19.0760, lng: profile?.longitude || 72.8777 }} />}
      {assigningDonation && <AssignVolunteerModal isOpen={!!assigningDonation} onClose={() => setAssigningDonation(null)} donation={assigningDonation} ngoId={user?.uid || ''} onAssigned={() => { navigate('/dashboard/ngo/track'); }} />}
      
      {/* HERO BANNER WITH BACKGROUND IMAGE */}
      <div className="relative w-full overflow-hidden flex items-center bg-[#0F1115] min-h-[280px] sm:min-h-[320px]">
         <div
           className="absolute inset-0 bg-cover bg-center bg-no-repeat"
           style={{ backgroundImage: "url('/ngo_bg.jpeg')" }}
         />
         <div className="absolute inset-0 bg-black/60" />
         
         <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-center">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div>
                   <Badge variant="outline" className="mb-2 bg-transparent text-emerald-400 border-[#3FAE49] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full">
                       NGO Partner Portal
                   </Badge>
                   <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                     Welcome back, {profile?.full_name || profile?.business_name || 'Partner NGO'}
                   </h1>
                   <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-lg leading-relaxed">
                     Coordinate pickups, manage volunteer operations, and route surplus food seamlessly to your community.
                   </p>
               </div>
               <div className="flex items-center gap-3">
                   <Button 
                       onClick={() => navigate('/dashboard/ngo/requests')}
                       className="bg-[#059669] hover:bg-[#047857] text-white shadow-sm text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shrink-0"
                   >
                       <Plus className="w-3.5 h-3.5" />
                       Request Food
                   </Button>
               </div>
            </div>
         </div>
      </div>

      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-6 pb-12 mt-6">
         
         {/* Quick Actions Header */}
         <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Quick actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                 <ActionCard
                     title="Request Food"
                     desc="Broadcast requirements to local restaurants."
                     icon={Utensils}
                     onClick={() => navigate('/dashboard/ngo/requests')}
                 />
                 <ActionCard
                     title="Available Donations"
                     desc="Browse and claim surplus food listings."
                     icon={Box}
                     onClick={() => navigate('/dashboard/ngo/incoming')}
                 />
                 <ActionCard
                     title="Track Delivery"
                     desc="Follow active pickups and deliveries."
                     icon={Truck}
                     onClick={() => navigate('/dashboard/ngo/track')}
                 />
                 <ActionCard
                     title="Manage Volunteers"
                     desc="Assign routes and coordinate drivers."
                     icon={Users}
                     onClick={() => navigate('/dashboard/ngo/volunteers')}
                 />
            </div>
         </div>

         {/* Impact Metrics Section */}
         <div>
            <div className="mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Your impact</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">A summary of your community contribution</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
               <KPICard label="Meals Rescued" value={mealsRescued.toLocaleString()} icon={Heart} />
               <KPICard label="Pickups Completed" value={pickupsCompleted.toLocaleString()} icon={CheckCircle2} />
               <KPICard label="Today's Pickups" value={todayPickups.toLocaleString()} icon={Clock} />
               <KPICard label="Nearby Restaurants" value={nearbyRestaurants.toLocaleString()} icon={Building} />
               <KPICard label="Active Volunteers" value={volunteerCount.toLocaleString()} icon={Users} />
            </div>
         </div>
         
         {/* Available Donations Section */}
         <div>
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Available Donations</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">Surplus food ready for immediate claim</p>
                </div>
                <Button variant="ghost" className="text-[#059669] dark:text-emerald-400 font-semibold text-xs h-auto p-0 hover:bg-transparent hover:underline" onClick={() => navigate('/dashboard/ngo/incoming')}>
                    View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
            </div>
            
            {availableDonations.length === 0 ? (
                <div className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center flex flex-col items-center shadow-sm">
                    <Box className="w-10 h-10 text-slate-300 mb-2" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">No active donations right now</h3>
                    <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">There are no surplus food donations available nearby at this moment. Check back later or expand your search area.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableDonations.map(d => (
                        <div key={d.id} className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-[#059669]/40 transition-all">
                            <div>
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                            {d.profiles?.avatar_url ? (
                                                <img src={d.profiles.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                                            ) : (
                                                <Building className="w-4 h-4 text-slate-400 m-2.5" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                                                {d.profiles?.restaurant_name || d.profiles?.business_name || d.profiles?.full_name || 'Restaurant'}
                                            </h3>
                                            <p className="text-[10px] text-slate-500">{calculateDistance(d.latitude, d.longitude)} km away</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/50 shrink-0">
                                        Exp: {new Date(d.expiry_time || d.pickup_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>

                                <h4 className="font-bold text-slate-900 dark:text-white text-[13px] truncate mb-1.5">
                                    {d.title || d.food_name || d.food_category}
                                </h4>

                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {d.quantity_kg && <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-slate-200 dark:border-slate-700">{d.quantity_kg} kg</Badge>}
                                    {d.estimated_meals && <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-slate-200 dark:border-slate-700">~{d.estimated_meals} meals</Badge>}
                                </div>

                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 dark:bg-[#16181D] p-2 rounded border border-slate-100 dark:border-slate-800/80 mb-3">
                                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                    <span className="truncate">{d.pickup_address || d.profiles?.address || 'Address provided upon acceptance'}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                                <Button variant="outline" className="flex-1 text-xs h-8 border-slate-200 dark:border-slate-700 bg-transparent" onClick={() => setViewingDonation(d)}>Details</Button>
                                <Button className="flex-1 bg-[#059669] hover:bg-[#047857] text-white text-xs h-8 shadow-sm" onClick={() => setAssigningDonation(d)}>Accept</Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
         </div>

         {/* Operations Center Section */}
         <div>
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Live deliveries</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">Track ongoing food pickups</p>
                </div>
            </div>
            <div className={isMapFullscreen ? "fixed inset-0 z-50 bg-white dark:bg-[#111113] p-4 flex flex-col" : "rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111111] shadow-sm h-[380px] relative"}>
                <Button 
                    variant="secondary" 
                    size="icon" 
                    className="absolute top-3 right-3 z-10 rounded-lg shadow-sm h-8 w-8 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                    onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                >
                    {isMapFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                <div className="w-full h-full relative rounded-[inherit] overflow-hidden">
                    <NGOLiveMap userId={user?.uid} />
                </div>
            </div>
         </div>

        

         {/* FAQs Section */}
         <div>
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Frequently asked questions</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">Helpful information for NGO partners</p>
                </div>
                <Button variant="ghost" className="text-[#059669] dark:text-emerald-400 font-semibold text-xs h-auto p-0 hover:bg-transparent hover:underline" onClick={() => navigate('/faq')}>
                    View All
                </Button>
            </div>
            <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden px-4 py-1">
                <Accordion className="w-full">
                   {[
                     { q: 'How to accept a donation?', a: 'Browse available donations from nearby restaurants in the Available Donations section. Click "Accept", then assign a volunteer driver to secure it.' },
                     { q: 'How are volunteers assigned?', a: 'When you accept a donation, you can assign it to any active volunteer driver from your team.' },
                     { q: 'How does live tracking work?', a: 'Once a volunteer starts a pickup, you can track their location in real-time on the Operations Center map using their device GPS.' },
                     { q: 'How do I complete delivery?', a: 'The volunteer will update the status to "Picked Up" and then "Completed" via their volunteer app.' }
                   ].map((faq, i) => (
                     <AccordionItem value={`item-${i}`} key={i} className="border-b border-slate-100 dark:border-slate-800/80 last:border-0 px-2">
                        <AccordionTrigger className="text-left font-semibold text-slate-900 dark:text-white hover:text-[#059669] py-3 hover:no-underline text-xs">{faq.q}</AccordionTrigger>
                        <AccordionContent className="text-slate-500 font-normal leading-relaxed pb-3 text-[11px]">
                          {faq.a}
                        </AccordionContent>
                     </AccordionItem>
                   ))}
                </Accordion>
            </div>
         </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}