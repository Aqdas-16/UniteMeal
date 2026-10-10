
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from 'sonner';
import { MapPin, Navigation, Clock, Building, Truck, CheckCircle2, PhoneCall, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { MapProvider as APIProvider } from '@/src/components/MapProvider';
import { Input } from '@/components/ui/input';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

export function VolunteerPortal() {
  const { user } = useAuth();
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [ngo, setNgo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [location, setLocation] = useState<{lat: number, lng: number, heading?: number} | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isLocationShared, setIsLocationShared] = useState(false);
  const [gpsError, setGpsError] = useState('');
  
  const [otpInput, setOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  
    const fetchActiveDelivery = async () => {
    if (!user) return;
    try {
      // Find the active delivery for this volunteer
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          donations(*),
          ngos(*)
        `)
        .eq('volunteer_id', user.uid)
        .in('status', ['assigned', 'accepted', 'heading_to_restaurant', 'arrived_restaurant', 'picked_up', 'heading_to_ngo', 'arrived_ngo'])
        .maybeSingle();
        
      if (error && error.code !== "PGRST116") console.error(error);
      
      // Update Volunteer Availability Status
      const currentAvailability = data ? 'busy' : 'online'; // online means available for tasks
      await supabase.from('volunteers').update({ availability: currentAvailability }).eq('id', user.uid);
      
      if (data) {
        setActiveDelivery(data);
        setNgo(data.ngos);
        
        // Fetch restaurant
        const { data: restData } = await supabase.from('profiles').select('*').eq('id', data.donations.donor_id).maybeSingle();
        setRestaurant(restData);
        
      } else {
        setActiveDelivery(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveDelivery();
    
    if (user) {
      const sub = supabase.channel(`deliveries_vol_${user.uid}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries', filter: `volunteer_id=eq.${user.uid}` }, () => {
           fetchActiveDelivery();
        }).subscribe();
      return () => { supabase.removeChannel(sub); };
    }
  }, [user]);

  // Request Location
  const requestLocation = () => {
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        async (pos) => {
          setIsLocationShared(true);
          setGpsError('');
          const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude, heading: pos.coords.heading || 0 };
          setLocation(newLoc);
          
          if (activeDelivery?.id && activeDelivery.status !== 'assigned') {
            await supabase.from('delivery_locations').insert({
              delivery_id: activeDelivery.id,
              location_lat: newLoc.lat,
              location_lng: newLoc.lng,
              heading: newLoc.heading,
              speed: pos.coords.speed,
              accuracy: pos.coords.accuracy
            });
          }
        },
        (err) => {
          setIsLocationShared(false);
          if (err.code === err.PERMISSION_DENIED) {
             setGpsError('Location access denied. Please enable GPS for live tracking. You can still proceed manually.');
          } else {
             setGpsError('Unable to get live location. You can still proceed manually.');
          }
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
      setWatchId(id);
    } else {
      setGpsError('Geolocation is not supported by your device. Proceeding manually.');
    }
  };

  useEffect(() => {
    if (activeDelivery && activeDelivery.status !== 'assigned' && !isLocationShared) {
       requestLocation();
    }
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [activeDelivery?.status, isLocationShared]);

  const updateStatus = async (newStatus: string, otpField?: string, otpValue?: string) => {
    if (!activeDelivery) return;
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'accepted') updates.accepted_at = new Date().toISOString();
      if (newStatus === 'arrived_restaurant') updates.arrived_restaurant_at = new Date().toISOString();
      if (newStatus === 'picked_up') updates.picked_up_at = new Date().toISOString();
      if (newStatus === 'arrived_ngo') updates.arrived_ngo_at = new Date().toISOString();
      if (newStatus === 'completed' || newStatus === 'delivered') updates.completed_at = new Date().toISOString();
      
      const { error } = await supabase.from('deliveries').update(updates).eq('id', activeDelivery.id);
      if (error) throw error;
      
      if (['completed', 'delivered'].includes(newStatus)) {
          await supabase.from('donations').update({ status: 'delivered' }).eq('id', activeDelivery.donation_id);
          await supabase.from('volunteers').update({ availability: 'online' }).eq('id', user?.uid);
      } else if (['cancelled', 'failed'].includes(newStatus)) {
          await supabase.from('volunteers').update({ availability: 'online' }).eq('id', user?.uid);
      }
      
      setActiveDelivery((prev: any) => prev ? { ...prev, status: newStatus } : null);
      
      toast.success(`Status updated to: ${newStatus.replace(/_/g, ' ')}`);
      
      if (newStatus === 'accepted') {
         requestLocation();
      }
      
      fetchActiveDelivery();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const verifyAndPickup = async () => {
    if (!activeDelivery || !otpInput) return toast.error("Please enter the pickup OTP");
    setVerifyingOtp(true);
    try {
      const { data, error } = await supabase.rpc('verify_pickup_otp', { p_delivery_id: activeDelivery.id, p_otp: otpInput });
      if (error) throw error;
      if (data) {
        toast.success("Pickup OTP Verified!");
        await updateStatus('picked_up');
        setOtpInput('');
      } else {
        toast.error("Invalid Pickup OTP");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const verifyAndDeliver = async () => {
    if (!activeDelivery || !otpInput) return toast.error("Please enter the delivery OTP");
    setVerifyingOtp(true);
    try {
      const { data, error } = await supabase.rpc('verify_delivery_otp', { p_delivery_id: activeDelivery.id, p_otp: otpInput });
      if (error) throw error;
      if (data) {
        toast.success("Delivery OTP Verified!");
        await updateStatus('completed');
        setOtpInput('');
      } else {
        toast.error("Invalid Delivery OTP");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  }

  if (!activeDelivery) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <Truck className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No active delivery</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">You are ready for your next assignment. When an NGO assigns you a delivery, it will appear here automatically.</p>
      </div>
    );
  }

  const status = activeDelivery.status;

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Header Info */}
      <div className="bg-white dark:bg-[#111113] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
             <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full uppercase tracking-wider mb-2 inline-block">
               Active Delivery
             </span>
             <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activeDelivery.donations?.title}</h2>
             <p className="text-sm font-medium text-slate-500 mt-1">{activeDelivery.donations?.quantity_kg} kg • {activeDelivery.donations?.estimated_meals} meals</p>
          </div>
          <div className="text-right">
             <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{status.replace(/_/g, ' ')}</p>
          </div>
        </div>
        
        {gpsError && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-start gap-2 mb-4 text-sm font-medium">
             <AlertCircle className="w-5 h-5 shrink-0" />
             <div className="flex-1">
               <p>{gpsError}</p>
               <Button size="sm" variant="outline" className="mt-2 bg-white dark:bg-[#111113]" onClick={requestLocation}>Enable Location</Button>
             </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-4">
          {status === 'assigned' && (
             <Button onClick={() => updateStatus('accepted')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-lg font-bold">Accept Delivery</Button>
          )}
          {status === 'accepted' && (
             <Button onClick={() => updateStatus('heading_to_restaurant')} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-bold">Start Navigation to Pickup</Button>
          )}
          {status === 'heading_to_restaurant' && (
             <Button onClick={() => updateStatus('arrived_restaurant')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-lg font-bold">I've Arrived at Pickup</Button>
          )}
          {status === 'arrived_restaurant' && (
             <div className="flex gap-2">
                <Input value={otpInput} onChange={e => setOtpInput(e.target.value)} placeholder="Enter Pickup OTP" className="h-12 text-lg font-bold text-center" />
                <Button onClick={verifyAndPickup} disabled={verifyingOtp} className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-6 font-bold">Verify</Button>
             </div>
          )}
          {status === 'picked_up' && (
             <Button onClick={() => updateStatus('heading_to_ngo')} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-bold">Start Route to NGO</Button>
          )}
          {status === 'heading_to_ngo' && (
             <Button onClick={() => updateStatus('arrived_ngo')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-lg font-bold">I've Arrived at NGO</Button>
          )}
          {status === 'arrived_ngo' && (
             <div className="flex gap-2">
                <Input value={otpInput} onChange={e => setOtpInput(e.target.value)} placeholder="Enter Delivery OTP" className="h-12 text-lg font-bold text-center" />
                <Button onClick={verifyAndDeliver} disabled={verifyingOtp} className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-6 font-bold">Verify</Button>
             </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="bg-slate-200 dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm h-[350px] md:h-[500px] border border-slate-200 dark:border-slate-800 relative">
        <MapComponent location={location} restaurant={restaurant} ngo={ngo} status={status} />
      </div>

      {/* Addresses */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#111113] p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
           <div className="flex items-center gap-2 mb-3">
             <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
               <Building className="w-4 h-4" />
             </div>
             <p className="font-bold text-slate-500 text-xs uppercase tracking-wider">Pickup</p>
           </div>
           <p className="font-bold text-slate-900 dark:text-white">{restaurant?.business_name || restaurant?.full_name || 'Restaurant'}</p>
           <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{restaurant?.address}</p>
           {restaurant?.phone && (
             <a href={`tel:${restaurant.phone}`} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-emerald-600">
               <PhoneCall className="w-4 h-4" /> Call Pickup
             </a>
           )}
        </div>
        <div className="bg-white dark:bg-[#111113] p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
           <div className="flex items-center gap-2 mb-3">
             <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
               <MapPin className="w-4 h-4" />
             </div>
             <p className="font-bold text-slate-500 text-xs uppercase tracking-wider">Dropoff</p>
           </div>
           <p className="font-bold text-slate-900 dark:text-white">{ngo?.organization_name || 'NGO'}</p>
           <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{ngo?.address}</p>
           {ngo?.contact_phone && (
             <a href={`tel:${ngo.contact_phone}`} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-blue-600">
               <PhoneCall className="w-4 h-4" /> Call NGO
             </a>
           )}
        </div>
      </div>
    </div>
  );
}

function MapComponent({ location, restaurant, ngo, status }: any) {
  const getLat = (obj: any) => obj?.location_lat || obj?.latitude ? Number(obj?.location_lat || obj?.latitude) : null;
  const getLng = (obj: any) => obj?.location_lng || obj?.longitude ? Number(obj?.location_lng || obj?.longitude) : null;

  const restaurantLat = getLat(restaurant);
  const restaurantLng = getLng(restaurant);
  
  const ngoLat = getLat(ngo);
  const ngoLng = getLng(ngo);

  const fallbackLat = 19.0760;
  const fallbackLng = 72.8777;

  let centerLat = fallbackLat;
  let centerLng = fallbackLng;

  if (location?.lat && location?.lng) {
      centerLat = location.lat;
      centerLng = location.lng;
  } else if ((status === 'assigned' || status === 'accepted' || status === 'heading_to_restaurant') && restaurantLat) {
      centerLat = restaurantLat;
      centerLng = restaurantLng;
  } else if (ngoLat) {
      centerLat = ngoLat;
      centerLng = ngoLng;
  } else if (restaurantLat) {
      centerLat = restaurantLat;
      centerLng = restaurantLng;
  }

  return (
    <APIProvider apiKey={API_KEY}>
       <Map
          defaultZoom={14}
          defaultCenter={{ lat: centerLat, lng: centerLng }}
          center={{ lat: centerLat, lng: centerLng }}
          mapId="volunteer_map"
          disableDefaultUI={true}
       >
         {restaurantLat && restaurantLng && (
           <AdvancedMarker position={{ lat: restaurantLat, lng: restaurantLng }}>
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-emerald-500">
                <Building className="w-5 h-5 text-emerald-600" />
              </div>
           </AdvancedMarker>
         )}
         {ngoLat && ngoLng && (
           <AdvancedMarker position={{ lat: ngoLat, lng: ngoLng }}>
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-blue-500">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
           </AdvancedMarker>
         )}
         <AdvancedMarker position={{lat: centerLat, lng: centerLng}}>
            <div 
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl border-2 border-slate-900 transition-transform duration-500"
              style={{ transform: `rotate(${location?.heading || 0}deg)` }}
            >
               <Truck className="w-6 h-6 text-slate-900" style={{ transform: 'rotate(-90deg)' }} />
            </div>
         </AdvancedMarker>
       </Map>
    </APIProvider>
  );
}
