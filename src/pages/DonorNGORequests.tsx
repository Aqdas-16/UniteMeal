import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function DonorNGORequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [donateQuantity, setDonateQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
    
    const channel = supabase.channel('ngo-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, fetchRequests)
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('requests')
      .select('*, ngos(organization_name, address)')
      .in('status', ['pending', 'partially_fulfilled'])
      .order('created_at', { ascending: false });
      
    if (data) {
      setRequests(data);
    }
    setLoading(false);
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRequest) return;
    
    const qty = Number(donateQuantity);
    const requiredQty = Number(selectedRequest.required_quantity_kg || selectedRequest.quantity_required);
    const fulfilledQty = Number(selectedRequest.fulfilled_quantity || 0);
    const remainingQty = requiredQty - fulfilledQty;
    
    if (qty <= 0) return toast.error("Quantity must be greater than zero");
    if (qty > remainingQty) return toast.error(`You cannot donate more than the remaining required quantity (${remainingQty})`);

    setIsSubmitting(true);
    
    try {
      // 1. Create Donation Record
      const estMeals = Math.floor(qty * 4); // basic calculation, 4 meals per kg
      
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 12); // Default expiry
      
      // Get restaurant details for pickup address
      const { data: profile } = await supabase.from('profiles').select('address, location_lat, location_lng').eq('id', user.uid).single();

      const { data: donation, error: donationError } = await supabase.from('donations').insert({
        donor_id: user.uid,
        request_id: selectedRequest.id,
        ngo_id: selectedRequest.ngo_id,
        title: selectedRequest.food_name || selectedRequest.title,
        food_category: 'cooked_food', // default
        food_type: selectedRequest.food_type,
        quantity_kg: qty,
        estimated_meals: estMeals,
        pickup_address: profile?.address || 'Restaurant Address',
        pickup_lat: profile?.location_lat,
        pickup_lng: profile?.location_lng,
        expiry_time: expiryTime.toISOString(),
        status: 'available'
      }).select().single();

      if (donationError) throw donationError;

      // 2. Update Request Status & Fulfilled Quantity
      const newFulfilled = fulfilledQty + qty;
      const newStatus = newFulfilled >= requiredQty ? 'fulfilled' : 'partially_fulfilled';
      
      const { error: reqError } = await supabase.from('requests')
        .update({ 
          fulfilled_quantity: newFulfilled,
          status: newStatus 
        })
        .eq('id', selectedRequest.id);

      if (reqError) throw reqError;
      
      toast.success("Thank you! Your donation has been recorded.");
      setSelectedRequest(null);
      setDonateQuantity('');
      fetchRequests();
      
    } catch (e: any) {
      toast.error(e.message || "Failed to process donation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">NGO Food Requests</h1>
          <p className="text-slate-500 font-medium mt-1">Fulfill specific needs requested by verified NGOs.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="text-center p-16 border border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-bold mb-2">No Active Requests</h3>
          <p className="text-slate-500">There are currently no open food requests from NGOs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req) => {
            const requiredQty = Number(req.required_quantity_kg || req.quantity_required);
            const fulfilledQty = Number(req.fulfilled_quantity || 0);
            const remainingQty = requiredQty - fulfilledQty;
            
            return (
              <Card key={req.id} className="shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      {req.urgency === 'Critical' && (
                        <Badge className="bg-red-100 text-red-800 border-0 mb-2">CRITICAL</Badge>
                      )}
                      {req.urgency === 'Urgent' && (
                        <Badge className="bg-amber-100 text-amber-800 border-0 mb-2">URGENT</Badge>
                      )}
                      <h3 className="text-xl font-bold">{req.food_name || req.title}</h3>
                      <p className="text-sm text-slate-500">By {req.ngos?.organization_name || 'Verified NGO'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4 text-sm bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Requested:</span>
                      <span className="font-bold">{requiredQty} {req.quantity_unit || 'kg'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Remaining Need:</span>
                      <span className="font-bold text-amber-600">{remainingQty} {req.quantity_unit || 'kg'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">For People:</span>
                      <span>{req.people_in_need}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Required By:</span>
                      <span>{req.required_by ? format(new Date(req.required_by), "MMM d, h:mm a") : 'N/A'}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white" 
                    onClick={() => setSelectedRequest(req)}
                  >
                    View & Respond
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedRequest} onOpenChange={() => { setSelectedRequest(null); setDonateQuantity(''); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Fulfill Request</DialogTitle>
            <DialogDescription>
              Donate food to fulfill this NGO's request.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <form onSubmit={handleDonate} className="space-y-6 pt-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                <h4 className="font-bold">{selectedRequest.food_name || selectedRequest.title}</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">Requested By:</span> <span>{selectedRequest.ngos?.organization_name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Category:</span> <span>{selectedRequest.category}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Food Type:</span> <span>{selectedRequest.food_type}</span></div>
                  <div className="flex justify-between pt-2 border-t mt-2">
                    <span className="font-semibold">Total Needed:</span> 
                    <span className="font-bold">{selectedRequest.required_quantity_kg || selectedRequest.quantity_required} {selectedRequest.quantity_unit || 'kg'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-amber-600">Still Remaining:</span> 
                    <span className="font-bold text-amber-600">{(selectedRequest.required_quantity_kg || selectedRequest.quantity_required) - (selectedRequest.fulfilled_quantity || 0)} {selectedRequest.quantity_unit || 'kg'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Available Quantity from Your Restaurant ({selectedRequest.quantity_unit || 'kg'})</Label>
                <Input 
                  type="number" 
                  min="0.1" 
                  step="0.1"
                  max={(selectedRequest.required_quantity_kg || selectedRequest.quantity_required) - (selectedRequest.fulfilled_quantity || 0)}
                  value={donateQuantity}
                  onChange={(e) => setDonateQuantity(e.target.value)}
                  placeholder="e.g. 5"
                  required
                />
                <p className="text-xs text-slate-500">
                  Estimated meals: {donateQuantity ? Math.floor(Number(donateQuantity) * 4) : 0}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="outline" type="button" onClick={() => setSelectedRequest(null)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isSubmitting ? "Processing..." : "Accept Request & Donate"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
