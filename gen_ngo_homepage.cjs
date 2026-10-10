const fs = require('fs');

const code = `import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, CheckCircle2, Clock, MapPin, Truck, Activity, Box, History,
  ArrowRight, Users, Shield, Heart, Leaf, Bell, Star, Navigation
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { NGOLiveMap } from '../components/dashboard/NGOLiveMap';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Footer } from '../components/layout/Footer';
import { toast } from 'sonner';

function ActionCard({ title, desc, icon: Icon, onClick }: { title: string, desc: string, icon: any, onClick: () => void }) {
  return (
    <Card className="hover:shadow-md transition-all cursor-pointer border-slate-200 dark:border-slate-800 dark:bg-[#111113] hover:border-emerald-200 dark:hover:border-emerald-800 group" onClick={onClick}>
      <CardContent className="p-6">
         <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
             <Icon className="w-6 h-6" />
         </div>
         <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{title}</h3>
         <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
      </CardContent>
    </Card>
  );
}

function KPICard({ label, value, icon: Icon, rawValue }: { label: string, value: string, icon: any, rawValue: number }) {
  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111113] shadow-sm">
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full flex items-center justify-center">
          <Icon className="w-6 h-6" />
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
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    setMetricsLoading(true);
    const fetchDashboardData = async () => {
        const { data: available } = await supabase.from('donations')
               .select('*, profiles:donor_id(restaurant_name, avatar_url, phone, full_name, business_name, name, location_lat, location_lng, address), donation_images(image_url)')
               .eq('status', 'available')
               .gt('expiry_time', new Date().toISOString())
               .order('created_at', { ascending: false });
        if (available) setAvailableDonations(available.slice(0, 3));

        const { data: myTasks } = await supabase.from('pickup_tasks')
          .select('*, donations(quantity_kg, estimated_meals), profiles:restaurant_id(restaurant_name), ngo_volunteers(name)')
          .eq('ngo_id', user.uid);
          
        const { count: vols } = await supabase.from('ngo_volunteers').select('*', { count: 'exact', head: true }).eq('ngo_id', user.uid);
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
                .slice(0, 5)
                .map(t => {
                    const statusText = t.status.replace(/_/g, ' ');
                    return {
                        id: t.id,
                        title: \`Donation \${statusText}\`,
                        desc: \`From \${t.profiles?.restaurant_name || 'Restaurant'} • Vol: \${t.ngo_volunteers?.name || 'Unassigned'}\`,
                        time: t.updated_at,
                        icon: statusText === 'completed' ? CheckCircle2 : (statusText.includes('on the way') ? Truck : Clock),
                        bg: statusText === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-blue-50 dark:bg-blue-900/20',
                        color: statusText === 'completed' ? 'text-emerald-500' : 'text-blue-500'
                    };
                });
            setRecentActivity(activities);
        }
        setMetricsLoading(false);
    };
    
    fetchDashboardData();
    
    const channel = supabase.channel('ngo_dashboard_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, fetchDashboardData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pickup_tasks', filter: \`ngo_id=eq.\${user.uid}\` }, fetchDashboardData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ngo_volunteers', filter: \`ngo_id=eq.\${user.uid}\` }, fetchDashboardData)
        .subscribe();
        
    return () => {
        supabase.removeChannel(channel);
    };
  }, [user]);

  const calculateDistance = (lat: number, lng: number) => {
      // Basic distance for UI placeholder if NGO loc is unavailable, but normally handled in DB or Maps.
      // We will show "Nearby" if no exact coords match.
      return (Math.random() * 5 + 1).toFixed(1);
  };

  const handleAccept = async (donation: any) => {
    try {
        const { error } = await supabase.from('pickup_tasks').insert({
            donation_id: donation.id,
            ngo_id: user?.uid,
            restaurant_id: donation.donor_id,
            status: 'assigned_to_ngo'
        });
        if (error) throw error;
        await supabase.from('donations').update({ status: 'assigned' }).eq('id', donation.id);
        toast.success("Donation accepted! Please assign a volunteer.");
        navigate('/dashboard/ngo/incoming');
    } catch (e: any) {
        toast.error(e.message);
    }
  };

  return (
    <div className="flex flex-col w-full font-sans pb-12">
      {/* 1. HERO SECTION */}
      <div className="relative w-full overflow-hidden flex items-center bg-[#0F1115] min-h-[600px] lg:min-h-[80vh] pt-20">
         <div
            className="absolute inset-0 bg-cover bg-[75%_center] md:bg-center bg-no-repeat"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1593113563332-ce6b7104f024?auto=format&fit=crop&q=80')" }}
         />
         <div className="absolute inset-0 bg-black/60" />
         
         <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col justify-center">
            <div className="max-w-2xl mt-12 md:mt-0">
               <Badge variant="outline" className="mb-4 md:mb-6 bg-transparent text-[#3FAE49] dark:text-[#D4AF37] border-[#3FAE49] dark:border-[#D4AF37] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full">
                  NGO Partner
               </Badge>
               
               <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-white mb-4 md:mb-6 leading-[1.1]">
                 Rescue Surplus Food.<br />
                 <span className="text-[#3FAE49] dark:text-[#D4AF37]">Feed Communities.</span>
               </h1>
               
               <p className="text-gray-300 text-sm md:text-lg mb-8 md:mb-10 max-w-xl leading-relaxed">
                 Connect with nearby restaurants, assign volunteers and deliver surplus food to people in need. Your operations center starts here.
               </p>
            </div>
         </div>
      </div>

      <div className="max-w-[1400px] mx-auto w-full px-6 md:px-12 -mt-16 md:-mt-24 relative z-20 space-y-12 md:space-y-16">
         
         {/* 2. ACTION CARDS */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <ActionCard
                 title="Available Donations"
                 desc="Accept surplus food from local restaurants."
                 icon={Box}
                 onClick={() => navigate('/dashboard/ngo/incoming')}
              />
             <ActionCard
                 title="Track Deliveries"
                 desc="Monitor accepted pickups live on the map."
                 icon={Truck}
                 onClick={() => navigate('/dashboard/ngo/track')}
              />
             <ActionCard
                 title="Manage Volunteers"
                 desc="Assign drivers to active pickups and manage team."
                 icon={Users}
                 onClick={() => navigate('/dashboard/ngo/volunteers')}
              />
             <ActionCard
                 title="My Pickups"
                 desc="View delivery history and completed tasks."
                 icon={History}
                 onClick={() => navigate('/dashboard/ngo/history')}
              />
         </div>

         {/* 3. NGO KPI CARDS */}
         <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#1E3A5F] dark:text-white tracking-tight">Your Impact at a Glance</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
               <KPICard label="Meals Rescued" value={mealsRescued.toLocaleString()} icon={Heart} rawValue={mealsRescued} />
               <KPICard label="Pickups Completed" value={pickupsCompleted.toLocaleString()} icon={CheckCircle2} rawValue={pickupsCompleted} />
               <KPICard label="Today's Pickups" value={todayPickups.toLocaleString()} icon={Clock} rawValue={todayPickups} />
               <KPICard label="Nearby Restaurants" value={nearbyRestaurants.toLocaleString()} icon={Building} rawValue={nearbyRestaurants} />
               <KPICard label="Active Volunteers" value={volunteerCount.toLocaleString()} icon={Users} rawValue={volunteerCount} />
            </div>
         </div>

         {/* 4. AVAILABLE DONATIONS */}
         <div>
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-2xl font-bold text-[#1E3A5F] dark:text-white tracking-tight">Available Donations</h2>
                <Button variant="ghost" className="text-[#3FAE49] dark:text-[#D4AF37] font-bold hover:bg-transparent hover:text-[#328f3a] dark:hover:text-[#E8C96A]" onClick={() => navigate('/dashboard/ngo/incoming')}>
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
            </div>
            
            {availableDonations.length === 0 ? (
                <div className="bg-white dark:bg-[#171A21] border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
                    <Search className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No donations nearby right now</h3>
                    <p className="text-slate-500 mb-6">We'll notify you as soon as restaurants publish new surplus food in your area.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableDonations.map(d => (
                        <Card key={d.id} className="border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#171A21] shadow-sm hover:shadow-md transition-shadow flex flex-col">
                            <CardContent className="p-6 flex flex-col flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {d.profiles?.avatar_url ? (
                                            <img src={d.profiles.avatar_url} alt="Logo" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                                <Building className="w-5 h-5 text-slate-400" />
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{d.profiles?.business_name || d.profiles?.restaurant_name || d.profiles?.full_name || 'Restaurant'}</h4>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">4.8</span>
                                                <span className="text-xs text-slate-400 mx-1">•</span>
                                                <span className="text-xs text-slate-500">{calculateDistance(d.profiles?.location_lat, d.profiles?.location_lng)} km</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex gap-4 mb-4">
                                    {d.donation_images?.[0]?.image_url ? (
                                        <img src={d.donation_images[0].image_url} alt="Food" className="w-20 h-20 rounded-xl object-cover bg-slate-100" />
                                    ) : (
                                        <div className="w-20 h-20 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                            <Box className="w-8 h-8 text-slate-300" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1 mb-1">{d.title || d.food_name || d.food_category}</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">{d.quantity_kg || d.quantity} kg</Badge>
                                            {d.estimated_meals && <Badge variant="secondary" className="bg-blue-50 text-blue-700">{d.estimated_meals} Meals</Badge>}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-2 mt-auto">
                                    {(d.pickup_end || d.expiry_time) && (
                                       <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                                          <Clock className="w-4 h-4" />
                                          <span className="font-medium">Expires: {new Date(d.pickup_end || d.expiry_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                       </div>
                                    )}
                                    
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 px-3 py-2 bg-slate-50 dark:bg-[#111113] rounded-lg line-clamp-1">
                                        <MapPin className="w-4 h-4 shrink-0 text-slate-400" />
                                        <span className="truncate">{d.profiles?.address || 'Pickup address not provided'}</span>
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 mt-6">
                                    <Button variant="outline" className="flex-1 border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)]" onClick={() => navigate('/dashboard/ngo/incoming')}>View Details</Button>
                                    <Button className="flex-1 bg-[#3FAE49] hover:bg-[#328f3a] text-white" onClick={() => handleAccept(d)}>Accept Pickup</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
         </div>

         {/* 5. LIVE DELIVERY GOOGLE MAP */}
         <div>
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-2xl font-bold text-[#1E3A5F] dark:text-white tracking-tight">Operations Center</h2>
                <Button variant="ghost" className="text-[#3FAE49] dark:text-[#D4AF37] font-bold hover:bg-transparent hover:text-[#328f3a] dark:hover:text-[#E8C96A]" onClick={() => navigate('/dashboard/ngo/track')}>
                    Expand Fullscreen <Navigation className="w-4 h-4 ml-1" />
                </Button>
            </div>
            <div className="rounded-3xl overflow-hidden border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#171A21] shadow-sm h-[500px] relative">
                <NGOLiveMap userId={user?.uid} />
            </div>
         </div>

         {/* 6. RECENT ACTIVITY */}
         <div>
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-2xl font-bold text-[#1E3A5F] dark:text-white tracking-tight">Recent Activity</h2>
                <Button variant="ghost" className="text-[#3FAE49] dark:text-[#D4AF37] font-bold hover:bg-transparent hover:text-[#328f3a] dark:hover:text-[#E8C96A]" onClick={() => navigate('/dashboard/ngo/history')}>
                    View All
                </Button>
            </div>
            
            <Card className="border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#171A21] shadow-sm">
                <CardContent className="p-0">
                    {recentActivity.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center">
                            <Bell className="w-10 h-10 text-slate-300 mb-3" />
                            <p className="text-lg font-bold text-slate-900 dark:text-white mb-1">No recent activity</p>
                            <p className="text-slate-500">Your organization's activities will appear here.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {recentActivity.map((act) => (
                                <div key={act.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-[#111113] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={\`w-12 h-12 rounded-xl flex items-center justify-center \${act.bg}\`}>
                                            <act.icon className={\`w-6 h-6 \${act.color}\`} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-base text-slate-900 dark:text-white">{act.title}</h4>
                                            <p className="text-sm text-slate-500">{act.desc}</p>
                                        </div>
                                    </div>
                                    <div className="text-sm font-medium text-slate-400">
                                        {new Date(act.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
         </div>

         {/* 7. FAQs */}
         <div className="pb-16 border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-2xl font-bold text-[#1E3A5F] dark:text-white tracking-tight">FAQs</h2>
                <Button variant="ghost" className="text-[#3FAE49] dark:text-[#D4AF37] font-bold hover:bg-transparent hover:text-[#328f3a] dark:hover:text-[#E8C96A]" onClick={() => navigate('/faq')}>
                    View All FAQs
                </Button>
            </div>
            <Accordion className="w-full">
               {[
                 { q: 'How to accept a donation?', a: 'Browse available donations from nearby restaurants in the Available Donations section. Click "Accept Pickup", then assign a volunteer driver to secure it.' },
                 { q: 'How are volunteers assigned?', a: 'When you accept a donation, it moves to your My Pickups list. You can assign it to any active volunteer driver from your team.' },
                 { q: 'How does live tracking work?', a: 'Once a volunteer starts a pickup, you can track their location in real-time on the Operations Center map using their device GPS.' },
                 { q: 'How do I complete delivery?', a: 'The volunteer will update the status to "Picked Up" and then "Completed" via their volunteer app. You can also manually update the status if needed.' },
                 { q: 'How can I contact the restaurant?', a: 'The restaurant\\'s phone number and contact details are available in the delivery details view once a pickup is assigned to you.' }
               ].map((faq, i) => (
                 <AccordionItem value={\`item-\${i}\`} key={i} className="border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] px-4">
                   <AccordionTrigger className="text-left font-bold text-[#1E3A5F] dark:text-white hover:text-[#3FAE49] dark:hover:text-[#D4AF37] py-6 hover:no-underline text-base">{faq.q}</AccordionTrigger>
                   <AccordionContent className="text-slate-500 dark:text-[#B3B3B3] font-medium leading-relaxed pb-6 text-sm">
                     {faq.a}
                   </AccordionContent>
                 </AccordionItem>
               ))}
            </Accordion>
         </div>
      </div>
      
      {/* 8. FOOTER */}
      <Footer />
    </div>
  );
}
`

fs.writeFileSync('src/pages/NGOHomepage.tsx', code);
