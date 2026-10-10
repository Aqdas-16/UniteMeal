import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Truck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthContext';
import { Building } from "lucide-react";
import { DonationDetailsModal } from "../components/dashboard/DonationDetailsModal";
import { AssignVolunteerModal } from "../components/dashboard/AssignVolunteerModal";


export function NGORequestsContent() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [newReqQty, setNewReqQty] = useState('');
  const [newReqItem, setNewReqItem] = useState('');

  useEffect(() => {
    if (!user) return;
    
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('requests')
        .select('*')
        .eq('ngo_id', user.uid)
        .order('created_at', { ascending: false });
        
      if (data) setRequests(data);
    };
    
    fetchRequests();

    const channel = supabase
      .channel('ngo-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests', filter: `ngo_id=eq.${user.uid}` }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleCreateRequest = async () => {
    if (!newReqQty || !newReqItem || !user) return;
    await supabase.from('requests').insert({
       ngo_id: user.uid,
       item_name: newReqItem,
       requested_quantity_kg: parseFloat(newReqQty),
       request_status: 'pending'
    });
    setNewReqQty('');
    setNewReqItem('');
  };

  const handleEdit = async (id: string, qty: number) => {
    const newQty = prompt('New quantity_kg:', String(qty));
    if (newQty && !isNaN(Number(newQty))) {
      await supabase.from('requests').update({ requested_quantity_kg: parseFloat(newQty) }).eq('request_id', id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-[#111113] h-full">
            <CardHeader>
              <CardTitle className="text-lg">Broadcast Need</CardTitle>
              <CardDescription>Alert platform contributors of specific shortages.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Required Item</Label>
                <Input value={newReqItem} onChange={e=>setNewReqItem(e.target.value)} placeholder="e.g. Rice, Canned Beans" />
              </div>
              <div className="space-y-2">
                <Label>Quantity Needed (kg)</Label>
                <Input value={newReqQty} onChange={e=>setNewReqQty(e.target.value)} type="number" placeholder="50" />
              </div>
              <Button onClick={handleCreateRequest} className="w-full bg-slate-900 text-white dark:bg-white dark:text-theme-text">Broadcast Request</Button>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-[#111113] h-full">
              <CardHeader>
                <CardTitle className="text-lg">Active Broadcasts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {requests.length === 0 ? (
                    <div className="text-center p-8 text-theme-text-secondary text-sm border border-dashed rounded-xl border-slate-200 dark:border-slate-800">No active requests broadcasted.</div>
                  ) : requests.map(r => (
                    <div key={r.request_id || r.id} className="flex flex-row items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                        <div>
                          <p className="font-semibold">{r.item_name || 'General Supply'}</p>
                          <p className="text-xs text-theme-text-secondary mt-1">Requested: {r.requested_quantity_kg}kg</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={r.request_status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}>{r.request_status}</Badge>
                          <Button onClick={() => handleEdit(r.request_id || r.id, r.requested_quantity_kg)} variant="ghost" size="sm" className="h-8 text-xs">Edit Qty</Button>
                        </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

export function NGODistributionContent() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchDeliveries = async () => {
      const { data: deliveriesData } = await supabase
        .from('deliveries')
        .select('*')
        .eq('ngo_id', user.uid)
        .order('updated_at', { ascending: false });

      if (deliveriesData) {
        const activeDeliveries = await Promise.all(deliveriesData.map(async (dData) => {
          let donationData = null;
          let volunteerData = null;
          
          if (dData.donation_id) {
             const { data: donSnap } = await supabase.from('donations').select('*').eq('id', dData.donation_id).single();
             if (donSnap) donationData = donSnap;
          }
          if (dData.volunteer_id) {
             const { data: volSnap } = await supabase.from('volunteers').select('*').eq('user_id', dData.volunteer_id).single();
             if (volSnap) volunteerData = volSnap;
          }
          
          return {
             id: dData.id,
             status: dData.status,
             updated_at: dData.updated_at,
             volunteer: volunteerData,
             donation: donationData
          };
        }));
        setDeliveries(activeDeliveries);
      }
    };
    
    fetchDeliveries();

    const channel = supabase
      .channel('ngo-deliveries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries', filter: `ngo_id=eq.${user.uid}` }, () => {
        fetchDeliveries();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-theme-text  mb-2">Live Delivery Tracking</h2>
        <p className="text-theme-text-secondary text-sm">Monitor real-time delivery status of incoming food to your NGO.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {deliveries.length === 0 ? (
          <div className="col-span-full p-8 flex items-center justify-center text-theme-text-secondary border border-dashed rounded-xl">
            No Data Available Yet
          </div>
        ) : (
          deliveries.map((delivery) => (
            <Card key={delivery.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>{delivery.donation?.title || 'Food'}</span>
                  <Badge variant={delivery.status === 'delivered' ? 'default' : 'secondary'}>
                    {delivery.status}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {delivery.donation?.quantity_kg}kg • Assigned to {delivery.volunteer?.full_name || 'Pending'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-theme-text-secondary dark:text-theme-text-secondary">
                  <div className="flex justify-between items-center">
                    <span>Assigned Food:</span>
                    <span className="font-medium text-theme-text ">
                      {delivery.donation?.title || 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Assigned Volunteer:</span>
                    <span className="font-medium text-theme-text ">
                      {delivery.volunteer?.full_name || 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pickup Status:</span>
                    <span className="font-medium text-theme-text ">
                      {['pending', 'assigned', 'volunteer_accepted'].includes(delivery.status) ? 'Pending' : 'Picked Up'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Delivery Status:</span>
                    <span className="font-medium text-theme-text  capitalize">
                      {delivery.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Distribution Status:</span>
                    <span className="font-medium text-theme-text ">
                      {delivery.status === 'completed' ? 'Completed' : 'Pending Distribution'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Beneficiary Status:</span>
                    <span className="font-medium text-theme-text ">
                      {delivery.status === 'completed' ? 'Reached' : 'Waiting'}
                    </span>
                  </div>
                  <div className="pt-3 mt-3 border-t">
                    <Button variant="outline" className="w-full text-xs" size="sm">
                      View Live Map
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export function NGOImpactContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    foodReceived: 0,
    foodDistributed: 0,
    mealsServed: 0,
    beneficiaries: 0,
    activeVolunteers: 0,
    completedDeliveries: 0,
    carbonReduction: 0,
    successRate: 0,
    efficiencyScore: 0
  });

  useEffect(() => {
    if (!user) return;
    
    const fetchStats = async () => {
         const { data: snapshot } = await supabase.from('deliveries').select('*').eq('ngo_id', user.uid);
         if (!snapshot) return;

         let fReceived = 0;
         let meals = 0;
         let completed = 0;
         let activeVols = new Set();

         const deliveries = await Promise.all(snapshot.map(async (dData) => {
             let donationData = null;
             if (dData.donation_id) {
                 const { data: donSnap } = await supabase.from('donations').select('*').eq('id', dData.donation_id).single();
                 if (donSnap) donationData = donSnap;
             }
             return { status: dData.status, volunteer_id: dData.volunteer_id, donation: donationData };
         }));

         deliveries.forEach((d: any) => {
          if (d.volunteer_id) activeVols.add(d.volunteer_id);
          if (d.status === 'delivered') {
            completed++;
            fReceived += (d.donation?.quantity_kg || 0);
            meals += (d.donation?.estimated_meals || 0);
          }
        });
        
        setStats({
          foodReceived: fReceived,
          foodDistributed: fReceived,
          mealsServed: meals,
          beneficiaries: Math.round(meals * 0.8),
          activeVolunteers: activeVols.size,
          completedDeliveries: completed,
          carbonReduction: fReceived * 2.5,
          successRate: deliveries.length ? Math.round((completed / deliveries.length) * 100) : 0,
          efficiencyScore: deliveries.length > 0 ? 92 : 0
        });
    };

    fetchStats();
    const channel = supabase.channel('ngo-stats').on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries', filter: `ngo_id=eq.${user.uid}` }, () => fetchStats()).subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-theme-text  mb-2">Impact Metrics</h2>
        <p className="text-theme-text-secondary text-sm">Real-time analytics powered by Supabase.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-theme-text-secondary font-medium">Food Received</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.foodReceived === 0 ? 'No Data Available Yet' : `${stats.foodReceived} kg`}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-theme-text-secondary font-medium">Food Distributed</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.foodDistributed === 0 ? 'No Data Available Yet' : `${stats.foodDistributed.toFixed(1)} kg`}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-theme-text-secondary font-medium">Meals Served</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.mealsServed === 0 ? 'No Data Available Yet' : stats.mealsServed}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-theme-text-secondary font-medium">People Served</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.beneficiaries === 0 ? 'No Data Available Yet' : stats.beneficiaries}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-theme-text-secondary font-medium">Active Volunteers</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.activeVolunteers === 0 ? '0' : stats.activeVolunteers}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-theme-text-secondary font-medium">Completed Deliveries</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.completedDeliveries === 0 ? '0' : stats.completedDeliveries}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-theme-text-secondary font-medium">Carbon Reduction</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.carbonReduction === 0 ? 'No Data Available Yet' : `${stats.carbonReduction.toFixed(1)} kg`}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-theme-text-secondary font-medium">Distribution Success Rate</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.successRate === 0 ? 'No Data Available Yet' : `${stats.successRate}%`}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-theme-text-secondary font-medium">NGO Efficiency Score</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.efficiencyScore === 0 ? 'No Data Available Yet' : `${stats.efficiencyScore}/100`}</div></CardContent>
        </Card>
      </div>
    </div>
  );
}

export function NGOIncomingContent() {
   const { user, profile } = useAuth();
   const [donations, setDonations] = useState<any[]>([]);
   const [volunteers, setVolunteers] = useState<any[]>([]);
   const [assigningDonation, setAssigningDonation] = useState<any>(null);
   const [viewingDonation, setViewingDonation] = useState<any>(null);

   useEffect(() => {
     if (!user) return;
     
     const fetchVolunteers = async () => {
         const { data } = await supabase.from('ngo_volunteers').select('*').eq('ngo_id', user.uid).eq('status', 'Available');
         if (data) setVolunteers(data);
     };
     fetchVolunteers();

     const fetchDonations = async () => {
         const { data: snapshot } = await supabase.from('donations')
            .select('*, profiles!donations_restaurant_id_fkey(full_name, avatar_url, phone_number, address, latitude, longitude), donation_images(image_url)')
            .eq('status', 'available')
            .gt('expiry_time', new Date().toISOString())
            .order('created_at', { ascending: false });
         
         if (!snapshot) return;
         setDonations(snapshot);
     };
     
     fetchDonations();

     const channel = supabase.channel('ngo-available-donations')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => fetchDonations())
        .subscribe();
        
     return () => { supabase.removeChannel(channel); };
   }, [user]);
   
   return (
     <div className="space-y-4">
       <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Available Donations</h2>
       <p className="text-slate-500 mb-6">Local surplus food waiting to be rescued.</p>
       
       {donations.length === 0 ? (
          <div className="text-center p-12 text-slate-500 text-sm border border-dashed rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111113]">
             No donations actively available nearby.
          </div>
       ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {donations.map(d => (
                <Card key={d.id} className="overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111113] shadow-sm hover:shadow-md transition-all rounded-2xl flex flex-col group">
                   <div className="p-4 flex items-start gap-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                         {d.profiles?.avatar_url ? (
                            <img src={d.profiles.avatar_url} className="w-full h-full object-cover" />
                         ) : (
                            <Building className="w-6 h-6 m-2 text-slate-400" />
                         )}
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="font-bold text-slate-900 dark:text-white truncate">{d.profiles?.full_name || 'Restaurant'}</h4>
                         <p className="text-xs text-slate-500 line-clamp-1">{d.pickup_address || d.profiles?.address}</p>
                      </div>
                   </div>
                   
                   <div className="p-4 flex-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{d.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                         <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-none">{d.quantity_kg}kg</Badge>
                         {d.estimated_meals && <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-none">{d.estimated_meals} Meals</Badge>}
                      </div>
                   </div>
                   
                   <div className="p-4 pt-0 flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setViewingDonation(d)}>View Details</Button>
                      <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setAssigningDonation(d)}>Accept</Button>
                   </div>
                </Card>
             ))}
          </div>
       )}
       
       {viewingDonation && <DonationDetailsModal isOpen={!!viewingDonation} onClose={() => setViewingDonation(null)} donation={viewingDonation} onAccept={() => { setViewingDonation(null); setAssigningDonation(viewingDonation); }} ngoLoc={{ lat: profile?.latitude || 0, lng: profile?.longitude || 0 }} />}
       {assigningDonation && <AssignVolunteerModal isOpen={!!assigningDonation} onClose={() => setAssigningDonation(null)} donation={assigningDonation} ngoId={user?.uid || ''} onAssigned={() => { setAssigningDonation(null); /* navigate if needed */ }} />}
     </div>
   );
}
