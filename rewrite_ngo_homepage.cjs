const fs = require('fs');

const code = `import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, CheckCircle2, Clock, MapPin, Truck, Navigation, Activity, Box, Sprout, TrendingUp, TrendingDown, 
  History, ShieldCheck, ChevronRight, FileText, LifeBuoy, HeartHandshake, Leaf, Heart, Users, Shield, 
  Search, Building, Building2, Info, ArrowRight, Bell
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DonorLiveMap } from '../components/dashboard/DonorLiveMap';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Footer } from '../components/layout/Footer';
import * as motion from 'motion/react-client';

function ActionCard({ title, desc, icon: Icon, onClick }: { title: string, desc: string, icon: any, onClick: () => void }) {
  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
      <Card 
        className="cursor-pointer border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111113] hover:border-emerald-500/50 hover:shadow-lg transition-all h-full group relative overflow-hidden" 
        onClick={onClick}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-4 flex items-center gap-4 relative z-10">
           <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 text-emerald-600 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-all duration-300">
               <Icon className="w-5 h-5" />
           </div>
           <div className="flex-1">
             <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">{title}</h3>
             <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{desc}</p>
           </div>
           <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-emerald-600">
             <ArrowRight className="w-3 h-3" />
           </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function KPICard({ label, value, icon: Icon, trend, trendLabel }: { label: string, value: string, icon: any, trend?: 'up' | 'down' | 'neutral', trendLabel?: string }) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111113] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden h-full">
        {/* Subtle accent border top */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-20" />
        <CardContent className="p-4 sm:p-5 flex flex-col h-full justify-between gap-3">
          <div className="flex justify-between items-start">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
            {trendLabel && (
              <Badge variant="secondary" className={\`text-[10px] px-1.5 py-0 h-5 border \${trend === 'up' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}\`}>
                {trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                {trendLabel}
              </Badge>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function NGOHomepage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [metrics, setMetrics] = useState({
    availableDonations: 0,
    acceptedToday: 0,
    mealsSaved: 0,
    foodRescued: 0,
    nearbyRestaurants: 0,
    activeVolunteers: 0,
    pendingPickups: 0,
    completedDeliveries: 0,
  });
  
  const [availableList, setAvailableList] = useState<any[]>([]);
  const [volunteerList, setVolunteerList] = useState<any[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    
    setMetricsLoading(true);
    
    const fetchDashboardData = async () => {
        try {
            // Available Donations
            const { data: available } = await supabase.from('donations')
               .select('*, profiles:donor_id(restaurant_name, avatar_url, phone, full_name, business_name, name), donation_images(image_url)')
               .ilike('status', 'available');
            
            // Ngo assigned tasks
            const { data: myTasks } = await supabase.from('pickup_tasks')
              .select('*, donations(quantity_kg, estimated_meals)')
              .eq('ngo_id', user.uid);
            
            // Volunteers
            const { data: vols } = await supabase.from('ngo_volunteers').select('*').eq('ngo_id', user.uid);
            
            // Restaurants
            const { count: restCount } = await supabase.from('restaurants').select('*', { count: 'exact', head: true });
            
            const today = new Date().toISOString().split('T')[0];
            const tasksToday = myTasks?.filter(t => t.created_at?.startsWith(today)) || [];
            const completed = myTasks?.filter(t => t.status === 'completed') || [];
            
            const pending = myTasks?.filter(t => t.status !== 'completed' && t.status !== 'cancelled') || [];
            
            // Build recent activity
            const activity: any[] = [];
            myTasks?.forEach(t => {
               if (t.status === 'completed' && t.completed_at) {
                  activity.push({ id: t.id + '-c', title: 'Completed Delivery', desc: \`Delivered \${t.donations?.quantity_kg || 0}kg of food\`, time: t.completed_at, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100' });
               }
               if (t.status === 'assigned' || t.status === 'on_the_way') {
                  activity.push({ id: t.id + '-a', title: 'Volunteer Assigned', desc: 'A volunteer is assigned to a pickup', time: t.created_at, icon: Users, color: 'text-blue-500', bg: 'bg-blue-100' });
               }
               if (t.created_at) {
                  activity.push({ id: t.id + '-new', title: 'Accepted Donation', desc: 'You accepted a new donation', time: t.created_at, icon: Box, color: 'text-[#3FAE49]', bg: 'bg-[#3FAE49]/10' });
               }
            });
            
            activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
            setRecentActivity(activity.slice(0, 5));
            
            const meals = completed.reduce((sum, t) => sum + (Number(t.donations?.estimated_meals) || 0), 0);
            
            setMetrics({
                availableDonations: available?.length || 0,
                acceptedToday: tasksToday.length,
                mealsSaved: meals,
                foodRescued: meals * 0.5,
                nearbyRestaurants: restCount || 0,
                activeVolunteers: vols?.length || 0,
                pendingPickups: pending.length,
                completedDeliveries: completed.length
            });
            setAvailableList(available?.slice(0, 3) || []);
            setVolunteerList(vols?.slice(0, 5) || []);
        } catch (e) {
            console.error(e);
        } finally {
            setMetricsLoading(false);
        }
    };

    fetchDashboardData();

    const channel = supabase.channel('ngo_dashboard_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, fetchDashboardData)
        .subscribe();
        
    return () => {
        supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="flex flex-col w-full font-sans pb-12 bg-[#F7F8FA] dark:bg-[#0A0A0A]">
      
      {/* 1. HERO SECTION (Compact) */}
      <div className="relative w-full overflow-hidden flex items-center bg-[#0A0A0A] min-h-[40vh] pt-16 pb-8 border-b border-white/10">
         <div
            className="absolute inset-0 bg-cover bg-[75%_center] md:bg-center bg-no-repeat opacity-40"
            style={{ backgroundImage: "url('/ngo_bg.jpeg')" }}
         />
         <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
         
         <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col justify-center items-start lg:pl-[35%]">
            <div className="max-w-2xl mt-8 bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
               <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full">
                     NGO Dashboard
                  </Badge>
                  <span className="text-white/50 text-sm">Welcome, {profile?.business_name || profile?.full_name || profile?.name || 'NGO'}</span>
               </div>
               
               <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4 leading-[1.1]">
                 Rescue Surplus Food.<br />
                 <span className="text-amber-500">Feed Communities.</span>
               </h1>
               
               <p className="text-gray-300 text-base mb-6 max-w-xl">
                 You have <span className="font-bold text-amber-400">{metrics.pendingPickups} pending</span> pickups today. Review available donations and dispatch your volunteers.
               </p>
               
               <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                  <Button
                      className="h-10 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 transition-all text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20"
                      onClick={() => navigate('/dashboard/ngo/incoming')}
                  >
                      <Search className="w-4 h-4" /> Browse Donations
                  </Button>
               </div>
            </div>
         </div>
      </div>

      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 md:px-12 -mt-6 relative z-20 space-y-8">
         
         {/* NGO KPI CARDS (Compact Grid) */}
         <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <KPICard label="Available" value={metricsLoading ? '...' : metrics.availableDonations.toString()} icon={Box} trend="up" trendLabel="Live" />
            <KPICard label="Today's Pickups" value={metricsLoading ? '...' : metrics.acceptedToday.toString()} icon={Truck} trend="neutral" trendLabel="Pending" />
            <KPICard label="Meals Rescued" value={metricsLoading ? '...' : metrics.mealsSaved.toString()} icon={Heart} trend="up" trendLabel="+12%" />
            <KPICard label="Active Volunteers" value={metricsLoading ? '...' : metrics.activeVolunteers.toString()} icon={Users} trend="neutral" trendLabel="Online" />
            <KPICard label="Nearby Partners" value={metricsLoading ? '...' : metrics.nearbyRestaurants.toString()} icon={Building2} trend="neutral" trendLabel="Within 15km" />
            <KPICard label="Deliveries" value={metricsLoading ? '...' : metrics.completedDeliveries.toString()} icon={CheckCircle2} trend="up" trendLabel="Total" />
         </div>

         {/* QUICK ACTIONS ROW */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             <ActionCard
                 title="Available Donations"
                 desc="View nearby restaurants offering food"
                 icon={Search}
                 onClick={() => navigate('/dashboard/ngo/incoming')}
              />
             <ActionCard
                 title="Manage Volunteers"
                 desc="Assign drivers to active pickups"
                 icon={Users}
                 onClick={() => navigate('/dashboard/ngo/volunteers')}
              />
             <ActionCard
                 title="Track Deliveries"
                 desc="Monitor accepted pickups live"
                 icon={MapPin}
                 onClick={() => navigate('/dashboard/ngo/track')}
              />
             <ActionCard
                 title="Impact Analytics"
                 desc="View reports and impact stats"
                 icon={Activity}
                 onClick={() => navigate('/dashboard/ngo/analytics')}
              />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* LEFT COLUMN: Map & Available */}
           <div className="lg:col-span-2 space-y-8">
             
             {/* AVAILABLE DONATIONS */}
             <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <Box className="w-5 h-5 text-emerald-500" /> Available Donations
                    </h2>
                    <Button variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-xs" onClick={() => navigate('/dashboard/ngo/incoming')}>
                        View All <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                </div>
                
                {availableList.length === 0 ? (
                    <div className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                           <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No donations nearby right now</h3>
                        <p className="text-sm text-slate-500 mb-6 max-w-sm">We'll notify you as soon as restaurants publish new surplus food in your area.</p>
                        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                          <Activity className="w-4 h-4 mr-2" /> Refresh Feed
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableList.map(d => (
                            <motion.div key={d.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                              <Card className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111113] shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all flex flex-col h-full">
                                <CardContent className="p-0 flex flex-col h-full">
                                  <div className="p-4 flex-1">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-2.5">
                                        {d.profiles?.avatar_url ? (
                                           <img src={d.profiles.avatar_url} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 object-cover" />
                                        ) : (
                                           <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                              <Building className="w-4 h-4 text-slate-400" />
                                           </div>
                                        )}
                                        <div>
                                           <p className="text-xs font-medium text-slate-900 dark:text-white line-clamp-1">{d.profiles?.business_name || d.profiles?.restaurant_name || d.profiles?.full_name || 'Restaurant'}</p>
                                           <p className="text-[10px] text-slate-500">{d.distance ? d.distance.toFixed(1) + ' km away' : 'Nearby'}</p>
                                        </div>
                                      </div>
                                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 text-[10px] uppercase font-bold shrink-0">
                                        Available
                                      </Badge>
                                    </div>
                                    
                                    <div className="flex gap-3 mb-3">
                                       {d.donation_images?.[0]?.image_url ? (
                                          <img src={d.donation_images[0].image_url} className="w-14 h-14 rounded-lg object-cover bg-slate-100 shrink-0" />
                                       ) : (
                                          <div className="w-14 h-14 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-800 shrink-0">
                                             <Box className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                                          </div>
                                       )}
                                       <div>
                                          <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 mb-0.5">{d.title || d.food_name || d.food_category}</h3>
                                          <div className="flex flex-wrap gap-1.5 mt-1">
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-200 dark:border-slate-700">{d.quantity_kg || d.quantity} kg</Badge>
                                            {d.estimated_meals && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-200 dark:border-slate-700">{d.estimated_meals} Meals</Badge>}
                                            {d.food_type && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-200 dark:border-slate-700">{d.food_type}</Badge>}
                                          </div>
                                       </div>
                                    </div>
                                    
                                    {(d.pickup_end || d.expiry_time) && (
                                       <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/10 px-2 py-1.5 rounded-md mt-auto">
                                          <Clock className="w-3.5 h-3.5" /> 
                                          <span className="font-medium">Expires: {new Date(d.pickup_end || d.expiry_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                       </div>
                                    )}
                                  </div>
                                  
                                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                                      <Button variant="outline" size="sm" className="flex-1 text-xs h-8 bg-white dark:bg-[#111113]" onClick={() => navigate('/dashboard/ngo/incoming')}>Details</Button>
                                      <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8" onClick={() => navigate('/dashboard/ngo/incoming')}>Accept</Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
             </div>

             {/* LIVE MAP: Operations Center */}
             <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                       <MapPin className="w-5 h-5 text-emerald-500" /> Operations Center
                    </h2>
                    <Button variant="ghost" size="sm" className="text-slate-500 text-xs" onClick={() => navigate('/dashboard/ngo/track')}>
                        Expand Map
                    </Button>
                </div>
                <div className="bg-white dark:bg-[#111113] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-[350px] w-full relative shadow-sm">
                   <DonorLiveMap userId={user?.uid} />
                </div>
             </div>
           </div>

           {/* RIGHT COLUMN: Recent Activity & FAQs */}
           <div className="space-y-8">
             
             {/* RECENT ACTIVITY */}
             <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                       <History className="w-5 h-5 text-emerald-500" /> Activity Log
                    </h2>
                </div>
                <Card className="bg-white dark:bg-[#111113] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                   <CardContent className="p-0">
                      {recentActivity.length === 0 ? (
                          <div className="py-12 px-6 text-center flex flex-col items-center">
                              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                 <Bell className="w-5 h-5 text-slate-400" />
                              </div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">No recent activity</p>
                              <p className="text-xs text-slate-500">Your organization's activities will appear here.</p>
                          </div>
                      ) : (
                          <div className="flex flex-col relative before:absolute before:inset-0 before:ml-[31px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                              {recentActivity.map((act, i) => (
                                  <div key={act.id} className={\`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active px-4 py-4 border-b border-slate-100 dark:border-slate-800/50 last:border-0\`}>
                                      {/* Icon */}
                                      <div className={\`flex items-center justify-center w-8 h-8 rounded-full border-2 border-white dark:border-[#111113] \${act.bg} text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2\`}>
                                          <act.icon className={\`w-3.5 h-3.5 \${act.color}\`} />
                                      </div>
                                      {/* Card */}
                                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)]">
                                          <div className="flex flex-col">
                                              <div className="flex items-center justify-between mb-0.5">
                                                 <h4 className="font-bold text-xs text-slate-900 dark:text-white">{act.title}</h4>
                                                 <time className="text-[10px] text-slate-400 font-medium">{new Date(act.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                                              </div>
                                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{act.desc}</p>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                      <div className="bg-slate-50 dark:bg-slate-900/30 p-2 border-t border-slate-100 dark:border-slate-800 text-center">
                          <Button variant="link" size="sm" className="text-xs text-emerald-600 dark:text-emerald-500 h-auto p-0" onClick={() => navigate('/dashboard/ngo/history')}>View Full History</Button>
                      </div>
                   </CardContent>
                </Card>
             </div>
             
             {/* NGO FAQs */}
             <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                       <Info className="w-5 h-5 text-emerald-500" /> Quick Help
                    </h2>
                </div>
                <Accordion type="single" collapsible className="w-full bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 shadow-sm">
                   {[
                     { q: 'How do I accept a donation?', a: 'Browse available donations from nearby restaurants. Click "Accept" and assign a volunteer driver to secure it.' },
                     { q: 'How do I assign volunteers?', a: 'When accepting a donation, you can select from a dropdown of your registered active volunteers.' },
                     { q: 'How does live tracking work?', a: 'Once a volunteer is assigned, you can track their location in real-time on the Operations Center map using their device GPS.' },
                   ].map((faq, i) => (
                     <AccordionItem value={\`item-\${i}\`} key={i} className="border-b border-slate-100 dark:border-slate-800/50 px-2 last:border-0">
                       <AccordionTrigger className="text-left font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 py-4 hover:no-underline text-xs">{faq.q}</AccordionTrigger>
                       <AccordionContent className="text-slate-500 dark:text-slate-400 text-xs pb-4 leading-relaxed">
                         {faq.a}
                       </AccordionContent>
                     </AccordionItem>
                   ))}
                </Accordion>
             </div>

           </div>
         </div>

      </div>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
`

fs.writeFileSync('src/pages/NGOHomepage.tsx', code);
