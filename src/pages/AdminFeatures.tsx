import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createNotification } from '@/lib/notifications';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Search, CheckCircle, XCircle, Clock, RefreshCw, Box } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { MotionSection, MotionItem, AnimatedCounter } from '@/components/ui/motion-primitives';
import { motion, AnimatePresence } from 'motion/react';

export function AdminUsersContent() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [ngos, setNgos] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [tab, setTab] = useState<'donor'|'ngo'>('donor');

  useEffect(() => {
    const fetchData = async () => {
      const { data: p } = await supabase.from('profiles').select('*');
      const { data: n } = await supabase.from('ngos').select('id');
      const { data: r } = await supabase.from('restaurants').select('user_id');
      if (p) setProfiles(p);
      if (n) setNgos(n);
      if (r) setRestaurants(r);
    };

    fetchData();

    const channel = supabase
      .channel('admin-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ngos' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => fetchData())
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleUpdate = async (id: string, status: string) => {
    try {
      await supabase.from('profiles').update({ account_status: status }).eq('id', id);
      createNotification({ userId: id, type: 'system_alert', title: 'Account Status Updated', message: `Your account has been ${status === 'active' ? 'activated' : 'suspended'}.`, priority: status === 'active' ? 'normal' : 'high' });
    } catch(e) {}
  };

  const filtered = profiles.filter(p => {
    if (tab === 'ngo') {
      return ngos.some(n => n.id === p.id) || p.role === 'ngo';
    } else {
      return restaurants.some(r => r.user_id === p.id) || p.role === 'donor';
    }
  });

  return (
    <MotionSection className="space-y-6 max-w-6xl mx-auto">
      <MotionItem className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
      </MotionItem>
      
      <MotionItem className="flex gap-2 border-b dark:border-slate-800 pb-2">
        <Button variant={tab === 'donor' ? 'default' : 'ghost'} onClick={() => setTab('donor')} className="transition-all active:scale-[0.98]">Food Contributors</Button>
        <Button variant={tab === 'ngo' ? 'default' : 'ghost'} onClick={() => setTab('ngo')} className="transition-all active:scale-[0.98]">Community NGOs</Button>
        
      </MotionItem>

      <MotionItem>
        <Card className="shadow-sm">
          <CardContent className="p-0 overflow-hidden rounded-xl">
            <div className="w-full overflow-x-auto"><Table className="min-w-[700px]">
              <TableHeader className="bg-slate-50 dark:bg-slate-900 border-b">
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filtered.length === 0 && (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <TableCell colSpan={4} className="text-center py-8 text-theme-text-secondary">No users found.</TableCell>
                    </motion.tr>
                  )}
                  {filtered.map((p, index) => (
                    <motion.tr 
                      key={p.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <TableCell className="font-medium">{p.email || 'N/A'}</TableCell>
                      <TableCell className="uppercase text-xs font-mono tracking-widest">{p.role}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={p.account_status === 'active' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200'}>
                          {p.account_status || 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Button onClick={() => handleUpdate(p.id, 'active')} variant="outline" size="sm" className="transition-transform active:scale-[0.98]">Activate</Button>
                        <Button onClick={() => handleUpdate(p.id, 'suspended')} variant="destructive" size="sm" className="transition-transform active:scale-[0.98]">Suspend</Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      </MotionItem>
    </MotionSection>
  );
}

export function AdminNGOVerificationContent() {
  const [ngos, setNgos] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [restaurantDocs, setRestaurantDocs] = useState<any[]>([]);
  const [tab, setTab] = useState<'ngo'|'restaurant'>('ngo');

    const fetchNgos = async () => {
      const { data } = await supabase.from('ngos').select('*');
      if (data) setNgos(data);
    };

    const fetchRestaurants = async () => {
        const { data } = await supabase.from('restaurants').select('*');
        if (data) setRestaurants(data);
    };

    const fetchDocs = async () => {
        const { data } = await supabase.from('documents').select('*');
        if (data) setRestaurantDocs(data);
    };

  useEffect(() => {
    fetchNgos();
    fetchRestaurants();
    fetchDocs();

    const channel1 = supabase.channel('admin-ngos').on('postgres_changes', { event: '*', schema: 'public', table: 'ngos' }, () => fetchNgos()).subscribe();
    const channel2 = supabase.channel('admin-rests').on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => fetchRestaurants()).subscribe();
    const channel3 = supabase.channel('admin-docs').on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => fetchDocs()).subscribe();
      
    return () => { 
        supabase.removeChannel(channel1);
        supabase.removeChannel(channel2);
        supabase.removeChannel(channel3);
    };
  }, []);

  const handleNgoUpdate = async (id: string, status: string, profileId: string) => {
    try {
        const { error } = await supabase.from('ngos').update({ is_verified: status === 'verified' }).eq('id', id);
        if (error) throw error;
        toast.success(`NGO ${status === 'verified' ? 'Approved' : 'Rejected'} successfully`);
        fetchNgos();
        if (profileId) {
           createNotification({ userId: profileId, type: 'system_alert', title: `Verification ${status === 'verified' ? 'Approved' : 'Rejected'}`, message: `Your NGO application has been ${status}.`, priority: status === 'verified' ? 'normal' : 'high' });
        }
    } catch (error) {
        console.error("Error updating NGO:", error);
        toast.error("Failed to update NGO");
    }
  };

  const handleRestaurantDocUpdate = async (docId: string, status: string, restaurantId: string, profileId: string) => {
    try {
        await supabase.from('documents').update({ status }).eq('id', docId);
        if (profileId) {
            createNotification({ userId: profileId, type: 'system_alert', title: `Document Status Updated`, message: `Your document has been marked as ${status}.`, priority: status === 'approved' ? 'normal' : 'high' });
        }
    } catch (error) {
        console.error("Error updating document:", error);
        toast.error("Failed to update document");
    }
  };
  
  const handleRestaurantUpdate = async (id: string, status: string, profileId: string) => {
    try {
        const { error } = await supabase.from('restaurants').update({ verification_status: status }).eq('restaurant_id', id);
        if (error) throw error;
        toast.success(`Restaurant ${status === 'verified' ? 'Approved' : 'Rejected'} successfully`);
        fetchRestaurants();
        if (profileId) {
            createNotification({ userId: profileId, type: 'system_alert', title: `Restaurant Verification ${status === 'verified' ? 'Approved' : 'Rejected'}`, message: `Your restaurant has been ${status}.`, priority: status === 'verified' ? 'normal' : 'high' });
        }
    } catch (error) {
        console.error("Error updating restaurant:", error);
        toast.error("Failed to update restaurant");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Verification System</h2>
        <Button variant="outline" size="sm" onClick={() => { fetchNgos(); fetchRestaurants(); fetchDocs(); }}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
      </div>
      
      <div className="flex gap-2 border-b dark:border-slate-800 pb-2">
        <Button variant={tab === 'ngo' ? 'default' : 'ghost'} onClick={() => setTab('ngo')} className="transition-all active:scale-[0.98]">Community NGOs</Button>
        <Button variant={tab === 'restaurant' ? 'default' : 'ghost'} onClick={() => setTab('restaurant')} className="transition-all active:scale-[0.98]">Restaurants</Button>
      </div>
      
      {tab === 'ngo' && (
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto"><Table className="min-w-[700px]">
            <TableHeader className="bg-slate-50 border-b">
              <TableRow>
                <TableHead>Community NGO Name</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ngos.map(n => (
                <TableRow key={n.id}>
                  <TableCell className="font-bold">{n.organization_name}</TableCell>
                  <TableCell className="font-mono text-xs">{n.registration_number || 'N/A'}</TableCell>
                  <TableCell className="truncate max-w-[200px] text-xs text-theme-text-secondary">{n.address || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={n.is_verified ? 'text-emerald-600 bg-emerald-50' : 'text-theme-text-secondary'}>
                      {n.is_verified ? <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Verified</span> : 'Verification Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Button onClick={() => handleNgoUpdate(n.id, 'verified', n.id)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">Approve</Button>
                    <Button onClick={() => handleNgoUpdate(n.id, 'rejected', n.id)} variant="destructive" size="sm">Reject</Button>
                  </TableCell>
                </TableRow>
              ))}
              {ngos.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-theme-text-secondary">No Community NGOs found.</TableCell></TableRow>}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
      )}

      {tab === 'restaurant' && (
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto"><Table className="min-w-[700px]">
            <TableHeader className="bg-slate-50 border-b">
              <TableRow>
                <TableHead>Restaurant Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Submitted Documents</TableHead>
                <TableHead>Verification Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restaurants.map(r => {
                const docs = restaurantDocs.filter(d => d.user_id === r.user_id);
                return (
                <TableRow key={r.restaurant_id}>
                  <TableCell className="font-bold">{r.business_name}</TableCell>
                  <TableCell className="text-xs">{r.owner_name || 'N/A'}</TableCell>
                  <TableCell className="max-w-[250px]">
                    <div className="flex flex-col gap-1">
                       {docs.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-1 px-2 rounded border text-xs">
                             <span className="font-mono truncate mr-2" title={doc.document_type}>{doc.document_type.replace('_', ' ')}</span>
                             <div className="flex items-center gap-1 shrink-0">
                                <Badge variant="outline" className={`text-[10px] py-0 h-4 ${doc.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : doc.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>{doc.status}</Badge>
                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mx-1">View</a>
                                <div className="flex gap-1 ml-1 border-l pl-1">
                                  <button onClick={() => handleRestaurantDocUpdate(doc.id, 'approved', r.restaurant_id, r.user_id)} className="text-emerald-600 hover:text-emerald-800" title="Approve Doc"><CheckCircle className="w-3 h-3"/></button>
                                  <button onClick={() => handleRestaurantDocUpdate(doc.id, 'rejected', r.restaurant_id, r.user_id)} className="text-red-600 hover:text-red-800" title="Reject Doc"><XCircle className="w-3 h-3"/></button>
                                  <button onClick={() => handleRestaurantDocUpdate(doc.id, 'request_reupload', r.restaurant_id, r.user_id)} className="text-amber-600 hover:text-amber-800" title="Request Re-upload"><Clock className="w-3 h-3"/></button>
                                </div>
                             </div>
                          </div>
                       ))}
                       {docs.length === 0 && <span className="text-xs text-slate-400">No documents uploaded</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={r.verification_status === 'verified' ? 'text-emerald-600 bg-emerald-50' : 'text-theme-text-secondary'}>
                      {r.verification_status === 'verified' ? <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Verified</span> : r.verification_status === 'rejected' ? 'Rejected' : 'Verification Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex justify-end gap-2 flex-col sm:flex-row">
                    <Button onClick={() => handleRestaurantUpdate(r.restaurant_id, 'verified', r.user_id)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">Approve Account</Button>
                    <Button onClick={() => handleRestaurantUpdate(r.restaurant_id, 'rejected', r.user_id)} variant="destructive" size="sm">Reject Account</Button>
                  </TableCell>
                </TableRow>
              )})}
              {restaurants.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-theme-text-secondary">No Restaurants found.</TableCell></TableRow>}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}


export function AdminDonationMonitoringContent() {
   const [donations, setDonations] = useState<any[]>([]);
   const [restaurants, setRestaurants] = useState<any[]>([]);
   const [deliveries, setDeliveries] = useState<any[]>([]);
   const [searchQuery, setSearchQuery] = useState('');
   const [filterStatus, setFilterStatus] = useState('all');

   useEffect(() => {
     const fetchData = async () => {
        const [donRes, restRes, delRes] = await Promise.all([
           supabase.from('donations').select('*').order('created_at', { ascending: false }),
           supabase.from('restaurants').select('*'),
           supabase.from('deliveries').select('*')
        ]);
        if (donRes.data) setDonations(donRes.data);
        if (restRes.data) setRestaurants(restRes.data);
        if (delRes.data) setDeliveries(delRes.data);
     };
     fetchData();
     const channelD = supabase.channel('admin-donations-mon').on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => fetchData()).subscribe();
     const channelV = supabase.channel('admin-deliveries-mon').on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, () => fetchData()).subscribe();
            
     return () => { supabase.removeChannel(channelD); supabase.removeChannel(channelV); };
   }, []);

   const handleArchive = async (id: string) => {
      if (confirm('Archive this completed donation?')) {
          await supabase.from('donations').update({ status: 'archived' }).eq('id', id);
          toast.success('Donation archived');
      }
   };

   // Merge data
   const enrichedDonations = donations.map(d => {
       const rest = restaurants.find(r => r.user_id === d.restaurant_id || r.restaurant_id === d.restaurant_id);
       const dlvrs = deliveries.filter(dlv => dlv.donation_id === d.id);
       dlvrs.sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
       const latestDelivery = dlvrs[0];
       
       let finalStatus = d.status;
       // If delivery is completed, override donation status
       if (latestDelivery && latestDelivery.status === 'delivered' && finalStatus !== 'archived') {
           finalStatus = 'delivered';
       }

       return {
           ...d,
           contributor_name: rest?.business_name || d.organization_name || 'Unknown Contributor',
           final_status: finalStatus,
           latestDelivery
       };
   });

   const filtered = enrichedDonations.filter(d => {
      if (filterStatus !== 'all' && d.final_status !== filterStatus) return false;
      if (searchQuery) {
         const search = searchQuery.toLowerCase();
         if (!d.id.toLowerCase().includes(search) && !d.title?.toLowerCase().includes(search) && !d.contributor_name?.toLowerCase().includes(search)) return false;
      }
      return true;
   });

   return (
      <div className="space-y-6 max-w-[1200px] mx-auto">
         <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Live Tracking Hub</h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
               <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input type="text" placeholder="Search orders..." className="w-full sm:w-64 pl-10 pr-4 py-2 text-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111113] rounded-full focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
               </div>
               <select className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111113] rounded-full px-4 py-2 text-sm shadow-sm" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                  <option value="all">All Orders</option>
                  <option value="available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="archived">Archived</option>
               </select>
            </div>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(d => (
                <div key={d.id} className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Order #{d.id.substring(0,6)}</div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{d.title}</h3>
                            <p className="text-sm text-slate-500 mt-0.5">{d.contributor_name}</p>
                        </div>
                        <Badge variant="outline" className={`uppercase text-[10px] py-1 px-2 ${
                            d.final_status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            d.final_status === 'assigned' || d.final_status === 'in_transit' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                            {d.final_status.replace('_', ' ')}
                        </Badge>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 mb-4 text-sm flex gap-4">
                        <div>
                           <div className="text-xs text-slate-400 mb-1">Quantity</div>
                           <div className="font-semibold">{d.quantity_kg}kg</div>
                        </div>
                        <div className="flex-1">
                           <div className="text-xs text-slate-400 mb-1">Pickup Area</div>
                           <div className="font-semibold truncate max-w-[150px]" title={d.pickup_address}>{d.pickup_address.split(',')[0]}</div>
                        </div>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="text-xs text-slate-400">
                           {d.created_at ? new Date(d.created_at).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : 'N/A'}
                        </div>
                        {d.final_status === 'delivered' && (
                            <Button variant="outline" size="sm" onClick={() => handleArchive(d.id)} className="text-xs h-8 rounded-full">Archive Order</Button>
                        )}
                        {d.final_status === 'archived' && (
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Archived</span>
                        )}
                    </div>
                </div>
            ))}
            {filtered.length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-500">
                    <Box className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-lg font-medium">No live orders found</p>
                    <p className="text-sm">Try adjusting your search or filters.</p>
                </div>
            )}
         </div>
      </div>
   )
}

export function AdminAnalyticsContent() {
   const [stats, setStats] = useState({
      totalDonations: 0,
      totalFoodSaved: 0,
      totalMealsSaved: 0,
      totalCarbonSaved: 0,
   });

   const [trendData, setTrendData] = useState<any[]>([]);
   const [stateData, setStateData] = useState<any[]>([]);

   useEffect(() => {
      const fetchAnalytics = async () => {
         const { data, error } = await supabase.from('donations').select('*');
         if (error || !data) return;

         let fSaved = 0;
         let mSaved = 0;
         let cSaved = 0;

         const dateMap: Record<string, { donations: number, food: number }> = {};
         const stateMap: Record<string, number> = {};

         data.forEach(d => {
            // Build trend map by day
            const dateObj = d.created_at ? new Date(d.created_at) : new Date();
            const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            
            if (!dateMap[dateStr]) dateMap[dateStr] = { donations: 0, food: 0 };
            dateMap[dateStr].donations += 1;

            if (d.status === 'delivered') {
               const qty = d.quantity_kg || 0;
               const meals = d.estimated_meals || 0;
               let kgQty = qty;
               if (d.unit === 'lbs') kgQty = qty * 0.453592;
               else if (d.unit === 'items') kgQty = qty * 0.5;

               fSaved += kgQty;
               mSaved += meals;
               cSaved += kgQty * 2.5;
               
               dateMap[dateStr].food += kgQty;

               // Group food distribution by state based on location
               let st = 'Other';
               const addr = (d.address || d.pickup_address || '').toLowerCase();
               if (addr.includes('maharashtra') || addr.includes('mumbai')) st = 'Maharashtra';
               else if (addr.includes('karnataka') || addr.includes('bangalore')) st = 'Karnataka';
               else if (addr.includes('delhi')) st = 'Delhi';
               else if (addr.includes('gujarat')) st = 'Gujarat';
               
               stateMap[st] = (stateMap[st] || 0) + kgQty;
            }
         });

         setStats({
            totalDonations: data.length,
            totalFoodSaved: parseFloat(fSaved.toFixed(1)),
            totalMealsSaved: mSaved,
            totalCarbonSaved: parseFloat(cSaved.toFixed(1))
         });

         const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
         setTrendData(daysOrder.map(day => ({ name: day, donations: dateMap[day]?.donations || 0, food: dateMap[day]?.food || 0 })));

         const sData = Object.keys(stateMap).map(k => ({ name: k, value: stateMap[k] }));
         setStateData(sData.length ? sData.sort((a,b)=>b.value-a.value) : [{ name: 'No Data', value: 1 }]);
      };

      fetchAnalytics();

      const channel = supabase.channel('admin-analytics')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, fetchAnalytics)
         .subscribe();
         
      return () => { supabase.removeChannel(channel); };
   }, []);

   return (
      <div className="space-y-6 max-w-6xl mx-auto">
         <h2 className="text-2xl font-bold tracking-tight">Platform Analytics</h2>
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
               <CardHeader><CardTitle className="text-sm">Contribution Volume (7 Days)</CardTitle></CardHeader>
               <CardContent className="h-72">
                  {trendData.some(d => d.donations > 0) ? (
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                           <YAxis fontSize={12} tickLine={false} axisLine={false} />
                           <RechartsTooltip />
                           <Legend />
                           <Line type="monotone" dataKey="donations" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                        </LineChart>
                     </ResponsiveContainer>
                  ) : (
                     <div className="h-full w-full flex items-center justify-center text-theme-text-secondary border border-dashed rounded bg-slate-50 dark:bg-slate-900/50">
                        No data available yet
                     </div>
                  )}
               </CardContent>
            </Card>

            <Card className="shadow-sm">
               <CardHeader><CardTitle className="text-sm">Food Saved (kg) & Distribution</CardTitle></CardHeader>
               <CardContent className="h-72">
                  {trendData.some(d => d.food > 0) ? (
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                           <YAxis fontSize={12} tickLine={false} axisLine={false} />
                           <RechartsTooltip />
                           <Legend />
                           <Bar dataKey="food" fill="#3b82f6" radius={[4,4,0,0]} />
                        </BarChart>
                     </ResponsiveContainer>
                  ) : (
                     <div className="h-full w-full flex items-center justify-center text-theme-text-secondary border border-dashed rounded bg-slate-50 dark:bg-slate-900/50">
                        No data available yet
                     </div>
                  )}
               </CardContent>
            </Card>

            <Card className="shadow-sm lg:col-span-2">
               <CardHeader><CardTitle className="text-sm">Top States by Active Contributions</CardTitle></CardHeader>
               <CardContent className="h-72">
                  {stateData.length > 1 || (stateData.length === 1 && stateData[0].name !== 'No Data') ? (
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stateData} layout="vertical">
                           <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                           <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                           <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} width={100} />
                           <RechartsTooltip />
                           <Bar dataKey="value" fill="#f59e0b" radius={[0,4,4,0]} />
                        </BarChart>
                     </ResponsiveContainer>
                  ) : (
                     <div className="h-full w-full flex items-center justify-center text-theme-text-secondary border border-dashed rounded bg-slate-50 dark:bg-slate-900/50">
                        No data available yet
                     </div>
                  )}
               </CardContent>
            </Card>
         </div>
      </div>
   )
}

export function AdminFeedbackContent() {
   const [messages, setMessages] = useState<any[]>([]);

   useEffect(() => {
      const fetchMessages = async () => {
         const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
         if (data) setMessages(data);
      };

      fetchMessages();

      const channel = supabase.channel('admin-support').on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => fetchMessages()).subscribe();
         
      return () => { supabase.removeChannel(channel); };
   }, []);

   return (
      <div className="space-y-6 max-w-6xl mx-auto">
         <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight">Support Messages & Feedback</h2>
         </div>

         <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
               <div className="w-full overflow-x-auto"><Table className="min-w-[700px]">
                  <TableHeader className="bg-slate-50 dark:bg-slate-900 border-b">
                     <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Sender Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Message</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {messages.map(m => (
                        <TableRow key={m.id}>
                           <TableCell className="text-xs text-theme-text-secondary whitespace-nowrap">
                              {m.created_at ? new Date(m.created_at).toLocaleString() : 'N/A'}
                           </TableCell>
                           <TableCell className="font-medium">{m.name}</TableCell>
                           <TableCell>{m.email}</TableCell>
                           <TableCell className="capitalize">{m.subject}</TableCell>
                           <TableCell className="max-w-[400px] truncate text-theme-text-secondary dark:text-theme-text-secondary">{m.message}</TableCell>
                        </TableRow>
                     ))}
                     {messages.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-theme-text-secondary">No support messages found.</TableCell></TableRow>}
                  </TableBody>
               </Table></div>
            </CardContent>
         </Card>
      </div>
   );
}

export function AdminReportsContent() {
   const handleExport = (type: string) => {
      const link = document.createElement('a');
      link.href = 'data:text/csv;charset=utf-8,DonationID,Date,Status\n123,2026-06-02,Delivered';
      link.download = `${type}_report_${new Date().getTime()}.csv`;
      link.click();
   };

   return (
      <div className="space-y-6 max-w-4xl mx-auto">
         <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight">Reporting Center</h2>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
               { title: 'Contribution Reports', desc: 'Full history of all contributions' },
               { title: 'Community NGO Reports', desc: 'NGO verifications and activity' },
               
               { title: 'Monthly Impact', desc: 'Food saved, carbon reduced grouped by month' }
            ].map(r => (
               <Card key={r.title} className="shadow-sm hover:border-emerald-500/50 transition-colors">
                  <CardHeader>
                     <CardTitle className="text-lg">{r.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <p className="text-sm text-theme-text-secondary mb-6">{r.desc}</p>
                     <div className="flex gap-2">
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => handleExport(r.title)}>
                           <Download className="w-4 h-4 mr-2" /> Download CSV
                        </Button>
                     </div>
                  </CardContent>
               </Card>
            ))}
         </div>
      </div>
   )
}

