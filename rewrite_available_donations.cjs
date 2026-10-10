const fs = require('fs');
const code = `import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Navigation, Clock, Leaf, Info, Phone, Package, Search } from 'lucide-react';
import { toast } from 'sonner';
import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin } from '@vis.gl/react-google-maps';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

// Haversine distance
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
  
  useEffect(() => {
    if (!user) return;
    
    // Fetch NGO Location
    const fetchNgo = async () => {
      const { data } = await supabase.from('ngos').select('location_lat, location_lng').eq('id', user.uid).maybeSingle();
      if (data && data.location_lat && data.location_lng) {
        setNgoLocation({ lat: Number(data.location_lat), lng: Number(data.location_lng) });
      } else {
        // Default to Mumbai center if not set
        setNgoLocation({ lat: 19.0760, lng: 72.8777 });
      }
    };
    
    fetchNgo();
    
    const fetchTeam = async () => {
      const { data } = await supabase.from('ngo_team').select('*').eq('ngo_id', user.uid);
      if (data) setTeamMembers(data);
    };
    
    fetchTeam();
    
  }, [user]);

  const fetchDonations = async () => {
    if (!user || !ngoLocation) return;
    const { data } = await supabase
      .from('donations')
      .select('*, profiles:restaurant_id(restaurant_name, avatar_url, phone)')
      .ilike('status', 'available');
      
    if (data) {
      const now = new Date();
      // Filter out expired and calculate distance
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
      
      // Filter by radius (default 15km)
      valid = valid.filter((d: any) => d.distance <= 15);
      
      // Sort nearest first
      valid.sort((a: any, b: any) => a.distance - b.distance);
      
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
      toast.error("Please select a team member to assign the pickup to.");
      return;
    }
    
    try {
      // 1. Update donation
      const { error: updErr } = await supabase.from('donations').update({
        status: 'accepted',
        ngo_id: user?.uid,
        updated_at: new Date().toISOString()
      }).eq('id', donation.id).ilike('status', 'available');
      
      if (updErr) throw updErr;
      
      // 2. Create pickup task
      const { error: taskErr } = await supabase.from('pickup_tasks').insert({
        donation_id: donation.id,
        restaurant_id: donation.restaurant_id || donation.donor_id,
        ngo_id: user?.uid,
        team_member_id: selectedMember,
        status: 'assigned'
      });
      
      if (taskErr) throw taskErr;
      
      // 3. Notify Restaurant
      await supabase.from('notifications').insert({
        user_id: donation.restaurant_id || donation.donor_id,
        title: 'Donation Accepted',
        message: 'An NGO has accepted your donation and assigned a driver.',
        type: 'donation_accepted',
        link_id: donation.id
      });
      
      toast.success("Donation accepted and pickup assigned!");
      setSelectedDonation(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to accept donation. Someone else might have taken it.");
    }
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
                    <div className="w-full sm:w-24 h-32 sm:h-24 bg-slate-100 rounded-lg shrink-0 overflow-hidden">
                      {d.profiles?.avatar_url ? (
                         <img src={d.profiles.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-semibold text-emerald-600 mb-1">{d.profiles?.restaurant_name || 'Restaurant'}</div>
                          <h3 className="text-lg font-bold text-slate-900">{d.food_name || d.title}</h3>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{d.description}</p>
                        </div>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
                          {d.distance.toFixed(1)} km
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Badge variant="secondary" className="bg-slate-100"><Package className="w-3 h-3 mr-1" /> {d.quantity_kg || d.quantity} kg</Badge>
                        <Badge variant="secondary" className="bg-slate-100"><Leaf className="w-3 h-3 mr-1" /> {d.veg_type || 'Veg/Non-Veg'}</Badge>
                        {(d.pickup_end || d.expiry_time) && (
                           <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                             <Clock className="w-3 h-3 mr-1" /> Expires: {new Date(d.pickup_end || d.expiry_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 flex justify-between items-center border-t border-slate-100">
                     <div className="text-xs text-slate-500">
                        Posted {new Date(d.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </div>
                     <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedDonation(d)}>View Details</Button>
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
                {/* NGO Location */}
                <AdvancedMarker position={ngoLocation}>
                  <Pin background={'#3b82f6'} borderColor={'#1d4ed8'} glyphColor={'#fff'} />
                </AdvancedMarker>
                
                {/* Donations */}
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Donation Details</DialogTitle>
          </DialogHeader>
          
          {selectedDonation && (
            <div className="space-y-6 pt-4">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden shrink-0">
                     {selectedDonation.profiles?.avatar_url ? (
                         <img src={selectedDonation.profiles.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-400">No Img</div>
                      )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{selectedDonation.profiles?.restaurant_name || 'Restaurant'}</h3>
                    <div className="flex items-center text-slate-500 text-sm mt-1">
                      <Phone className="w-3 h-3 mr-1" />
                      {selectedDonation.profiles?.phone || 'No phone provided'}
                    </div>
                  </div>
               </div>
               
               <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900">{selectedDonation.food_name || selectedDonation.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{selectedDonation.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <div className="text-xs text-slate-500">Quantity</div>
                        <div className="font-medium">{selectedDonation.quantity_kg || selectedDonation.quantity} kg</div>
                     </div>
                     <div>
                        <div className="text-xs text-slate-500">Category</div>
                        <div className="font-medium">{selectedDonation.category || selectedDonation.food_category}</div>
                     </div>
                     <div>
                        <div className="text-xs text-slate-500">Type</div>
                        <div className="font-medium">{selectedDonation.veg_type || 'Veg/Non-Veg'}</div>
                     </div>
                     <div>
                        <div className="text-xs text-slate-500">Distance</div>
                        <div className="font-medium">{selectedDonation.distance.toFixed(1)} km</div>
                     </div>
                  </div>
                  
                  {selectedDonation.special_instructions && (
                     <div>
                        <div className="text-xs text-slate-500">Instructions</div>
                        <div className="font-medium text-sm">{selectedDonation.special_instructions}</div>
                     </div>
                  )}
               </div>
               
               <div>
                  <div className="text-sm font-medium mb-2">Assign Team Member</div>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                    value={selectedMember} 
                    onChange={e => setSelectedMember(e.target.value)}
                  >
                    <option value="">Select a member...</option>
                    {teamMembers.map(m => (
                       <option key={m.id} value={m.id}>{m.name} ({m.vehicle_type || 'No vehicle'})</option>
                    ))}
                  </select>
               </div>
               
               <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setSelectedDonation(null)}>Close</Button>
                  <Button onClick={() => handleAccept(selectedDonation)}>Accept & Assign Pickup</Button>
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
