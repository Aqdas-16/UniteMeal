import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/PageHeader';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Clock, MapPin, Truck, Navigation, Box, Zap, Share, AlertTriangle, PlayCircle, Store, TrendingUp, Navigation2, History, Sprout, HeartHandshake, Utensils, Leaf, Drumstick, Croissant, ShoppingBag, Wheat, Search, Filter, RefreshCcw, Plus, X, MoreVertical, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../components/theme-provider';
import { TrackDeliveriesContent } from '../pages/TrackDeliveriesContent';
import { Map as GoogleMap, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapProvider as APIProvider } from '@/src/components/MapProvider';
import { useRef } from 'react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && !API_KEY.includes('YOUR_');

import { AddressAutocompleteInput } from '@/components/ui/AddressAutocomplete';
import { supabase } from '@/lib/supabase';


import { toast } from 'sonner';
import { createNotification, createAuditLog } from '@/lib/notifications';

export { CreateDonationContent } from "../components/dashboard/CreateDonation";
export { DonationHistoryContent } from "../components/dashboard/DonationHistory";

export function DonorTrackContent() {
    return <TrackDeliveriesContent />;
}

// ---------------------------------------------------------------------------
// 4. ANALYTICS (PREMIUM DASHBOARD)
// ---------------------------------------------------------------------------
export function DonorImpactMetricsContent() {
  const [stats, setStats] = useState({ meals: 0, carbon: 0, people: 0, ngos: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    if (!user) return;
    const fetchImpact = async () => {
       const { data, error } = await supabase
         .from('donations')
         .select('*')
         .eq('donor_id', user.uid)
         .order('created_at', { ascending: true });

       if (error || !data) return;
       
       let totalMeals = 0;
       let totalCarbon = 0;
       const ngoSet = new Set<string>();
       const monthlyData: Record<string, number> = {};

       data.forEach((d: any) => {
         if (d.status === 'delivered') {
            const meals = d.estimated_meals || 0;
            const qty = d.quantity_kg || 0;
            totalMeals += meals;
            totalCarbon += qty * 2.5;
            if (d.ngo_id) ngoSet.add(d.ngo_id);

            const monthYear = d.created_at ? new Date(d.created_at).toLocaleString('default', { month: 'short' }) : 'Unknown';
            monthlyData[monthYear] = (monthlyData[monthYear] || 0) + meals;
         }
       });

       setStats({ meals: totalMeals, carbon: parseFloat(totalCarbon.toFixed(1)), people: totalMeals, ngos: ngoSet.size });
       
       setChartData(Object.keys(monthlyData).map(k => ({ month: k, meals: monthlyData[k] })));
    };
    fetchImpact();
  }, [user]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
       <div className="mb-8">
           <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Business Intelligence</h2>
           <p className="text-slate-500 font-medium mt-1">Impact metrics and operational forecasting</p>
       </div>

       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <Card className="bg-white dark:bg-[#111113] border-slate-200 dark:border-slate-800 shadow-sm">
           <CardContent className="p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Box className="w-4 h-4"/> Meals Generated</p>
              <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.meals.toLocaleString()}</p>
           </CardContent>
         </Card>
         <Card className="bg-white dark:bg-[#111113] border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
           <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/10 rounded-bl-full -mr-4 -mt-4 opacity-50 z-0"></div>
           <CardContent className="p-6 relative z-10">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Sprout className="w-4 h-4 text-emerald-500"/> Carbon Saved</p>
              <p className="text-4xl font-black text-emerald-600 dark:text-emerald-500">{stats.carbon.toLocaleString()}<span className="text-lg text-emerald-600/50 ml-1">kg</span></p>
           </CardContent>
         </Card>
         <Card className="bg-white dark:bg-[#111113] border-slate-200 dark:border-slate-800 shadow-sm">
           <CardContent className="p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Store className="w-4 h-4"/> NGOs Supported</p>
              <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.ngos}</p>
           </CardContent>
         </Card>
         <Card className="bg-white dark:bg-[#111113] border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-[#111113]">
           <CardContent className="p-6">
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Zap className="w-4 h-4"/> Avg Match Time</p>
              <p className="text-4xl font-black text-indigo-700 dark:text-indigo-400">4.2<span className="text-lg text-indigo-400 ml-1">min</span></p>
           </CardContent>
         </Card>
       </div>
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <Card className="lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111113]">
             <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 p-5">
                 <CardTitle className="text-lg font-bold">Contribution Growth Trend</CardTitle>
             </CardHeader>
             <CardContent className="p-6">
               <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                           <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: isDark ? '#1e293b' : 'white', color: isDark ? 'white' : 'black' }} />
                        <Area type="monotone" dataKey="meals" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMeals)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
             </CardContent>
           </Card>

           <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111113]">
               <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 p-5">
                 <CardTitle className="text-lg font-bold">AI Forecast</CardTitle>
               </CardHeader>
               <CardContent className="p-6 flex flex-col justify-center gap-6">
                   <div className="text-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">Predicted Demand (Next 7 Days)</p>
                       <p className="text-3xl font-black text-slate-900 dark:text-white">+24%</p>
                       <p className="text-xs font-medium text-emerald-600 mt-2">High demand for prepared meals</p>
                   </div>
                   <div className="space-y-4">
                       <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider">AI Recommendations</h4>
                       <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800/50">
                           <p className="text-xs font-bold text-amber-800 dark:text-amber-500">Consider Donating Earlier</p>
                           <p className="text-[11px] text-amber-700/80 dark:text-amber-500/80 mt-1">Donating before 4 PM increases match rate by 30%.</p>
                       </div>
                   </div>
               </CardContent>
           </Card>
       </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. AI MATCH CENTER (SMART RECOMMENDATIONS)
// ---------------------------------------------------------------------------
export function AIRecommendationContent() {
   const recommendations = [
       { id: 1, ngo: "Safe Haven Community", distance: "4.2", time: "12m", demand: "High", capacity: "Available", prob: "94", score: "98", reason: "Recommended because refrigeration capacity is available, current workload is low, and historical acceptance rate is high." },
       { id: 2, ngo: "Helping Hands Org", distance: "7.5", time: "22m", demand: "Medium", capacity: "Limited", prob: "85", score: "88", reason: "Good alternative due to consistent weekly demands, though distance increases logistics overhead." },
       { id: 3, ngo: "City Food Bank", distance: "12.1", time: "35m", demand: "Low", capacity: "High", prob: "60", score: "72", reason: "Backup option. High storage capacity but significant route deviation." }
   ];

   return (
       <div className="max-w-4xl mx-auto space-y-6 pt-4">
           
           <div className="text-center mb-10">
               <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-800/50">
                   <Zap className="w-8 h-8" />
               </div>
               <h1 className="text-3xl font-black text-slate-900 dark:text-white">AI Match Center</h1>
               <p className="text-slate-500 font-medium mt-2 max-w-lg mx-auto">Our routing engine automatically scores nearby NGOs based on capacity, distance, and real-time demand.</p>
           </div>

           <div className="space-y-4">
               {recommendations.map((rec, idx) => (
                   <Card key={rec.id} className={`border-slate-200 dark:border-slate-800 shadow-sm transition-all overflow-hidden bg-white dark:bg-[#111113] hover:border-indigo-300 dark:hover:border-indigo-700 ${idx === 0 ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-50 dark:ring-offset-[#09090b]' : ''}`}>
                       <CardContent className="p-6">
                           <div className="flex flex-col md:flex-row justify-between gap-6">
                               
                               <div className="flex-1">
                                   <div className="flex items-center gap-3 mb-2">
                                       <h3 className="text-xl font-bold text-slate-900 dark:text-white">{rec.ngo}</h3>
                                       {idx === 0 && <Badge className="bg-indigo-500 text-white border-0 py-0.5">Top Match</Badge>}
                                   </div>
                                   <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed font-medium">"{rec.reason}"</p>
                                   
                                   <div className="flex gap-4 text-sm font-medium">
                                       <div className="flex items-center gap-1.5 text-slate-500"><Navigation2 className="w-4 h-4"/> {rec.distance} km</div>
                                       <div className="flex items-center gap-1.5 text-slate-500"><Clock className="w-4 h-4"/> {rec.time}</div>
                                       <div className="flex items-center gap-1.5 text-slate-500"><Box className="w-4 h-4"/> Capacity: {rec.capacity}</div>
                                   </div>
                               </div>

                               <div className="md:w-48 shrink-0 flex flex-col justify-end">
                                   <div className="flex justify-between items-end mb-1">
                                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Confidence</span>
                                       <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{rec.score}%</span>
                                   </div>
                                   <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mb-4 overflow-hidden">
                                       <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${rec.score}%` }}></div>
                                   </div>
                                   <Button className="w-full h-10 rounded-xl font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90" variant={idx !== 0 ? 'outline' : 'default'} disabled={idx === 0}>
                                       {idx === 0 ? 'Assigned' : 'Manual Override'}
                                   </Button>
                               </div>

                           </div>
                       </CardContent>
                   </Card>
               ))}
           </div>
       </div>
   );
}

// ---------------------------------------------------------------------------
// 6. NGO REQUESTS MARKETPLACE
// ---------------------------------------------------------------------------
export function DonorNGORequestsContent() {
   const { user } = useAuth();
   const [requests, setRequests] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
       const fetchRequests = async () => {
           setLoading(true);
           const { data, error } = await supabase
               .from('requests')
               .select('*')
               .eq('status', 'open')
               .order('created_at', { ascending: false });
           
           if (!error && data) {
               setRequests(data);
           }
           setLoading(false);
       };
       fetchRequests();
   }, []);

   const handleFulfill = async (reqId: string) => {
       alert('Food donation workflow will open to fulfill this request.');
   };

   return (
       <div className="max-w-5xl mx-auto space-y-6 pt-4">
           <div className="flex justify-between items-center mb-8">
               <div>
                   <h1 className="text-3xl font-black text-slate-900 dark:text-white">NGO Requests</h1>
                   <p className="text-slate-500 font-medium mt-1 max-w-lg">View active food requests from NGOs in your community and fulfill them directly.</p>
               </div>
           </div>

           {loading ? (
               <div className="text-center py-20 text-slate-500">Loading requests...</div>
           ) : requests.length === 0 ? (
               <div className="text-center p-16 border border-dashed rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111113] shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Active Requests</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">There are currently no open food requests from NGOs in your area.</p>
               </div>
           ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {requests.map((req) => (
                       <Card key={req.id} className="border-slate-200 dark:border-slate-800 shadow-sm transition-all overflow-hidden bg-white dark:bg-[#111113] hover:shadow-md">
                           <CardContent className="p-6">
                               <div className="flex justify-between items-start mb-4">
                                   <div>
                                       <Badge className="bg-amber-100 text-amber-800 border-0 mb-2 py-0.5 pointer-events-none dark:bg-amber-900/30 dark:text-amber-400">URGENT</Badge>
                                       <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{req.title}</h3>
                                       <p className="text-slate-500 text-sm mt-1">{req.ngo_name}</p>
                                   </div>
                               </div>
                               
                               <div className="space-y-2 mb-6 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                   <div className="flex justify-between">
                                       <span className="text-slate-500">Needed By:</span>
                                       <span className="text-slate-900 dark:text-white">{new Date(req.needed_by).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                   </div>
                                   <div className="flex justify-between">
                                       <span className="text-slate-500">Quantity Needed:</span>
                                       <span className="text-slate-900 dark:text-white">{req.quantity_needed} kg</span>
                                   </div>
                                   <div className="flex justify-between">
                                       <span className="text-slate-500">Food Type:</span>
                                       <span className="text-slate-900 dark:text-white">{req.food_type}</span>
                                   </div>
                               </div>

                               <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 italic">"{req.description}"</p>
                               
                               <Button className="w-full h-11 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm" onClick={() => handleFulfill(req.id)}>
                                   Fulfill Request
                               </Button>
                           </CardContent>
                       </Card>
                   ))}
               </div>
           )}
       </div>
   );
}



export function DonorRequestsContent() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;
        const fetchRequests = async () => {
            const { data, error } = await supabase
                .from('food_requests')
                .select('*, donations(*), ngos(*)')
                .eq('restaurant_id', user.uid)
                .order('requested_at', { ascending: false });
            
            if (error) {
                console.error("Error fetching food requests:", error);
                return;
            }
            if (data) setRequests(data);
        };
        fetchRequests();

        const channel = supabase.channel('food_requests_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'food_requests', filter: `restaurant_id=eq.${user.uid}` }, () => fetchRequests())
            .subscribe();
            
        return () => { supabase.removeChannel(channel); };
    }, [user]);

    const handleAccept = async (req: any) => {
        // 1. Update request status to accepted
        await supabase.from('food_requests').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', req.id);
        
        // 2. Create delivery
        const { data: deliveryData } = await supabase.from('deliveries').insert({
            donation_id: req.donation_id,
            ngo_id: req.ngo_id,
            status: 'pending'
        }).select('id').single();
        
        // 3. Update donation status to assigned (or reserved)
        await supabase.from('donations').update({ status: 'assigned' }).eq('id', req.donation_id);

        // 4. Notifications & Audit
        await createNotification({
            userId: req.ngo_id,
            type: 'ngo_request',
            title: 'Request Accepted',
            message: 'Your food request has been accepted by the restaurant.',
            relatedEntityType: 'request',
            relatedEntityId: req.id,
            priority: 'high',
            actionUrl: '/dashboard/ngo'
        });

        await createAuditLog({
            entityName: 'food_requests',
            entityId: req.id,
            action: 'status_changed',
            performedBy: user?.uid,
            changes: { status: 'accepted' }
        });
    };

    const handleReject = async (req: any) => {
        await supabase.from('food_requests').update({ status: 'rejected' }).eq('id', req.id);

        await createNotification({
            userId: req.ngo_id,
            type: 'ngo_request',
            title: 'Request Declined',
            message: 'A restaurant was unable to fulfill your food request at this time.',
            relatedEntityType: 'request',
            relatedEntityId: req.id,
            priority: 'normal'
        });

        await createAuditLog({
            entityName: 'food_requests',
            entityId: req.id,
            action: 'status_changed',
            performedBy: user?.uid,
            changes: { status: 'rejected' }
        });
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <HeartHandshake className="w-8 h-8 text-indigo-500" /> NGO Requests
                </h2>
                <p className="text-slate-500 font-medium mt-1">Review and manage food requests from NGOs in your area.</p>
            </div>

            {requests.length === 0 ? (
                <div className="py-20 text-center border rounded-xl dark:border-slate-800">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HeartHandshake className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No NGO requests yet</h3>
                    <p className="text-slate-500">When an NGO requests your available food, it will appear here.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {requests.map(req => (
                        <div key={req.id} className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-lg">{req.ngos?.full_name || 'Unknown NGO'}</h4>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Requested: {req.donations?.title || req.donations?.food_category}</p>
                                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(req.requested_at).toLocaleString()}</span>
                                    <span className="flex items-center gap-1"><Zap className="w-4 h-4" /> {req.donations?.quantity_kg}kg ({req.donations?.estimated_meals} meals)</span>
                                </div>
                                {req.message && (
                                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                        "{req.message}"
                                    </p>
                                )}
                            </div>
                            
                            <div className="flex items-center justify-between md:justify-end gap-3 md:min-w-[250px]">
                                <Badge variant="outline" className={`uppercase tracking-wider font-bold ${
                                    req.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    req.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                    {req.status}
                                </Badge>
                                
                                {req.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleReject(req)}>Reject</Button>
                                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleAccept(req)}>Accept</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
