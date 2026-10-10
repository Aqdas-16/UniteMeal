const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Navigation, Clock, Leaf, Info, Phone, Package, Search, Users, Car, Bike, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; 
  return d;
}

export function NGOIncomingContent() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<any[]>([]);
  const [ngoLocation, setNgoLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchNgo = async () => {
      const { data } = await supabase.from('ngos').select('location_lat, location_lng').eq('id', user.uid).maybeSingle();
      if (data && data.location_lat && data.location_lng) {
        setNgoLocation({ lat: Number(data.location_lat), lng: Number(data.location_lng) });
      } else {
        setNgoLocation({ lat: 19.0760, lng: 72.8777 });
      }
    };
    
    fetchNgo();
    
    const fetchTeam = async () => {
      // Only show volunteers belonging to current NGO
      const { data } = await supabase.from('ngo_volunteers').select('*').eq('ngo_id', user.uid);
      if (data) setTeamMembers(data);
    };
    
    fetchTeam();
  }, [user]);

  const fetchDonations = async () => {
    if (!user || !ngoLocation) return;
    const { data } = await supabase
      .from('donations')
      .select('*, profiles:donor_id(restaurant_name, avatar_url, phone, full_name, business_name, name), donation_images(image_url)')
      .eq('status', 'available');
      
    if (data) {
      const now = new Date();
      let valid = data.filter((d: any) => {
        if (d.expiry_time && new Date(d.expiry_time) < now) return false;
        return true;
      });
      
      valid = valid.map((d: any) => {
        const dist = getDistanceFromLatLonInKm(
          ngoLocation.lat, ngoLocation.lng, 
          Number(d.pickup_lat || d.latitude || 0), 
          Number(d.pickup_lng || d.longitude || 0)
        );
        return { ...d, distance: dist };
      });
      
      valid.sort((a, b) => a.distance - b.distance);
      setDonations(valid);
    }
  };

  useEffect(() => {
    if (ngoLocation) fetchDonations();
    
    const channel = supabase.channel('ngo-donations-avail')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => {
        if (ngoLocation) fetchDonations();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [ngoLocation]);

  const handleAccept = async (donation: any) => {
    if (!selectedMember) {
      toast.error('Please select a volunteer');
      return;
    }
    
    setIsAccepting(true);
    try {
      // Get NGO Name for assignment
      const { data: ngoData } = await supabase.from('ngos').select('organization_name').eq('id', user?.uid).single();
      const ngoName = ngoData?.organization_name || 'An NGO';
      const restaurantId = donation.restaurant_id || donation.donor_id;

      // Single transaction is ideal, but we can do it sequentially for now
      // 1. Update donation
      const { error: updErr } = await supabase.from('donations').update({
        status: 'accepted',
        ngo_id: user?.uid,
        accepted_at: new Date().toISOString(),
        assigned_ngo_name: ngoName,
        assigned_volunteer_id: selectedMember,
        updated_at: new Date().toISOString()
      }).eq('id', donation.id);
      
      if (updErr) throw updErr;
      
      // 2. Create pickup task
      const { data: task, error: taskErr } = await supabase.from('pickup_tasks').insert({
        donation_id: donation.id,
        restaurant_id: restaurantId,
        ngo_id: user?.uid,
        team_member_id: selectedMember,
        status: 'assigned'
      }).select().single();
      
      if (taskErr) throw taskErr;

      // 3. Create delivery record
      const { error: deliveryErr } = await supabase.from('deliveries').insert({
         donation_id: donation.id,
         ngo_id: user?.uid,
         volunteer_id: selectedMember,
         status: 'accepted'
      });

      if (deliveryErr) console.error("Could not create delivery record", deliveryErr);
      
      // 4. Notifications
      await supabase.from('notifications').insert([
        {
          user_id: restaurantId,
          title: 'Donation Accepted',
          message: \`\${ngoName} has accepted your donation and assigned a driver.\`,
          type: 'delivery_update',
          related_entity_id: donation.id, related_entity_type: 'donation'
        },
        {
          user_id: selectedMember,
          title: 'New Pickup Assigned',
          message: \`You have been assigned to pick up a donation from \${donation.profiles?.restaurant_name || donation.profiles?.business_name || 'a restaurant'}.\`,
          type: 'delivery_update',
          related_entity_id: donation.id, related_entity_type: 'donation'
        }
      ]);
      
      toast.success("Donation accepted and pickup assigned!");
      setSelectedDonation(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to accept donation. Someone else might have taken it.");
    } finally {
      setIsAccepting(false);
    }
  };

  const getVehicleIcon = (type: string) => {
      const v = type?.toLowerCase() || '';
      if (v.includes('bike') || v.includes('motorcycle')) return <Bike className="w-4 h-4" />;
      if (v.includes('truck')) return <Truck className="w-4 h-4" />;
      return <Car className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Available Donations</h2>
          <p className="text-slate-500">Live feed of food available within 15km.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {donations.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed rounded-lg border-slate-200">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No donations found</h3>
              <p className="text-slate-500">There are no available donations nearby at the moment.</p>
            </div>
          ) : (
            donations.map(d => (
              <Card key={d.id} className="overflow-hidden hover:border-emerald-500 transition-colors">
                <CardContent className="p-0">
                  <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-32 h-40 sm:h-32 bg-slate-100 rounded-lg shrink-0 overflow-hidden relative">
                      {d.donation_images && d.donation_images.length > 0 ? (
                         <img src={d.donation_images[0].image_url} className="w-full h-full object-cover" alt="Food Photo" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800">
                             <Package className="w-8 h-8 text-slate-300" />
                         </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {d.profiles?.avatar_url && <img src={d.profiles.avatar_url} className="w-5 h-5 rounded-full object-cover" alt="Restaurant Avatar" />}
                            <div className="text-xs font-semibold text-emerald-600">{d.profiles?.restaurant_name || d.profiles?.business_name || d.profiles?.full_name || 'Restaurant'}</div>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900">{d.food_name || d.title}</h3>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{d.description}</p>
                        </div>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
                          {d.distance.toFixed(1)} km
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Badge variant="secondary" className="bg-slate-100"><Package className="w-3 h-3 mr-1" /> {d.quantity_kg || d.quantity} kg</Badge>
                        {d.estimated_meals && <Badge variant="secondary" className="bg-slate-100"><Users className="w-3 h-3 mr-1" /> {d.estimated_meals} Meals</Badge>}
                        <Badge variant="secondary" className="bg-slate-100"><Leaf className="w-3 h-3 mr-1" /> {d.veg_type || 'Veg/Non-Veg'}</Badge>
                        {(d.pickup_end || d.expiry_time) && (
                           <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                             <Clock className="w-3 h-3 mr-1" /> Expires: {new Date(d.pickup_end || d.expiry_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 flex flex-col gap-3 border-t border-slate-100">
                     <div className="text-xs text-slate-500 flex justify-between">
                        <span>Posted {new Date(d.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span>{d.pickup_address || 'Address hidden until accepted'}</span>
                     </div>
                     <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setSelectedDonation(d)}>View Details</Button>
                        <Button size="sm" className="bg-[#3FAE49] hover:bg-[#328f3a]" onClick={() => setSelectedDonation(d)}>Accept Pickup</Button>
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        <div className="h-[400px] lg:h-[calc(100vh-140px)] sticky top-4 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          {ngoLocation && API_KEY && (
            <APIProvider apiKey={API_KEY}>
              <Map
                defaultZoom={12}
                defaultCenter={ngoLocation}
                mapId="ngo_map_id"
                disableDefaultUI={true}
              >
                <AdvancedMarker position={ngoLocation}>
                  <Pin background={'#3b82f6'} borderColor={'#1d4ed8'} glyphColor={'#fff'} />
                </AdvancedMarker>
                
                {donations.map(d => (
                  <AdvancedMarker 
                     key={d.id} 
                     position={{lat: Number(d.pickup_lat || d.latitude || 0), lng: Number(d.pickup_lng || d.longitude || 0)}}
                    onClick={() => setSelectedDonation(d)}
                  >
                    <Pin background={'#10b981'} borderColor={'#047857'} glyphColor={'#fff'} />
                  </AdvancedMarker>
                ))}
              </Map>
            </APIProvider>
          )}
        </div>
      </div>
      
      <Dialog open={!!selectedDonation} onOpenChange={(open) => !open && setSelectedDonation(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Accept Pickup</DialogTitle>
          </DialogHeader>
          
          {selectedDonation && (
            <div className="space-y-6 pt-4">
               {/* Volunteer Selection */}
               <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Choose Volunteer</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {teamMembers.map(vol => (
                        <div 
                           key={vol.id}
                           onClick={() => setSelectedMember(vol.id)}
                           className={\`p-3 border rounded-xl cursor-pointer flex gap-3 transition-colors \${selectedMember === vol.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-200'}\`}
                        >
                           <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0 overflow-hidden">
                              {vol.photo_url ? <img src={vol.photo_url} className="w-full h-full object-cover" /> : null}
                           </div>
                           <div className="flex-1">
                              <div className="font-bold text-sm text-slate-900">{vol.name}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                 <Phone className="w-3 h-3" /> {vol.phone}
                              </div>
                              <div className="flex gap-2 mt-1.5">
                                 <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 flex items-center gap-1">
                                    {getVehicleIcon(vol.vehicle)} {vol.vehicle || 'Unknown'}
                                 </Badge>
                                 <Badge variant="secondary" className={\`text-[10px] py-0 px-1.5 h-4 \${vol.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}\`}>
                                    {vol.status || 'Available'}
                                 </Badge>
                              </div>
                           </div>
                        </div>
                     ))}
                     {teamMembers.length === 0 && (
                        <div className="col-span-2 text-center p-4 border rounded-xl text-slate-500 text-sm">
                           No volunteers available. Please add volunteers to your team first.
                        </div>
                     )}
                  </div>
               </div>

               <div className="bg-slate-50 p-4 rounded-lg space-y-4 border border-slate-100">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0">
                        {selectedDonation.profiles?.avatar_url && (
                           <img src={selectedDonation.profiles.avatar_url} className="w-full h-full object-cover" />
                        )}
                     </div>
                     <div>
                        <h4 className="font-bold text-slate-900">{selectedDonation.profiles?.restaurant_name || selectedDonation.profiles?.business_name || 'Restaurant'}</h4>
                        <div className="text-sm text-slate-500">{selectedDonation.distance.toFixed(1)} km away</div>
                     </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{selectedDonation.food_name || selectedDonation.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{selectedDonation.description}</p>
                  </div>
               </div>
               
               <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setSelectedDonation(null)}>Cancel</Button>
                  <Button 
                     className="bg-emerald-600 hover:bg-emerald-700 text-white" 
                     onClick={() => handleAccept(selectedDonation)}
                     disabled={isAccepting || !selectedMember}
                  >
                     {isAccepting ? 'Confirming...' : 'Confirm Pickup'}
                  </Button>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
`;

fs.writeFileSync('src/pages/NGOIncomingContent.tsx', code);
