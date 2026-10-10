import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, Clock, Building, Truck, CheckCircle2, User, Play, StopCircle, Share2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { MapProvider as APIProvider } from '@/src/components/MapProvider';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

function DirectionsRenderer({ directions }: { directions: any }) {
    const map = useMap();
    const [renderer, setRenderer] = useState<any>(null);
    useEffect(() => {
        if (!map || !window.google || !window.google.maps || !window.google.maps.DirectionsRenderer) return;
        const newRenderer = new window.google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true,
            polylineOptions: { strokeColor: '#10b981', strokeWeight: 5 }
        });
        setRenderer(newRenderer);
        return () => newRenderer.setMap(null);
    }, [map]);
    useEffect(() => {
        if (renderer && directions) {
            renderer.setDirections(directions);
        }
    }, [renderer, directions]);
    return null;
}

export function TrackDeliveriesContent() {
    const { user, profile } = useAuth();
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
    const [directions, setDirections] = useState<any>(null);
    const [volunteerLocation, setVolunteerLocation] = useState<{lat: number, lng: number, heading: number} | null>(null);
    
    const fetchDeliveries = async () => {
        if (!user || !profile) return;
        
        let query = supabase.from('deliveries')
            .select('*, donations(*), ngo:ngos(*)')
            .in('status', ['assigned', 'accepted', 'heading_to_restaurant', 'arrived_restaurant', 'picked_up', 'heading_to_ngo', 'arrived_ngo'])
            .order('updated_at', { ascending: false });
            
        if (profile.role === 'ngo') {
            query = query.eq('ngo_id', user.uid);
        }
        // Donor check requires joining with donations table which Supabase handles via inner join filtering:
        // We'll filter in JS for now if it's donor
        
        const { data, error } = await query;
        if (error) console.error("Error fetching deliveries:", error);
            
        if (data) {
            let filtered = data;
            if (profile.role === 'donor') {
               filtered = data.filter(d => d.donations?.donor_id === user.uid);
            }
            
            // For each delivery, fetch the restaurant profile separately to avoid complex joins
            const enhanced = await Promise.all(filtered.map(async (d) => {
               const { data: vData } = await supabase.from('profiles').select('*').eq('id', d.volunteer_id).maybeSingle();
               d.volunteer = vData;
               const { data: rData } = await supabase.from('restaurants').select('*').eq('user_id', d.donations.donor_id).maybeSingle();
               if (!rData) {
                   const { data: pData } = await supabase.from('donors').select('*').eq('id', d.donations.donor_id).maybeSingle();
                   return { ...d, restaurant: pData };
               }
               return { ...d, restaurant: rData };
            }));
            
            setDeliveries(enhanced);
            if (enhanced.length > 0 && !selectedDelivery) {
                setSelectedDelivery(enhanced[0]);
            } else if (selectedDelivery) {
                const updated = enhanced.find(d => d.id === selectedDelivery.id);
                if (updated) setSelectedDelivery(updated);
            }
        }
    };
    
    useEffect(() => {
        fetchDeliveries();
        if (!user || !profile) return;
        
        const sub = supabase.channel('track-dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, () => {
                fetchDeliveries();
            }).subscribe();
        return () => { supabase.removeChannel(sub); };
    }, [user, profile]);
    
    // Subscribe to delivery_locations for the selected delivery
    useEffect(() => {
        if (!selectedDelivery) return;
        
        const fetchLatestLoc = async () => {
           const { data } = await supabase.from('delivery_locations')
              .select('*')
              .eq('delivery_id', selectedDelivery.id)
              .order('recorded_at', { ascending: false })
              .limit(1)
              .maybeSingle();
           if (data) {
              setVolunteerLocation({ lat: data.location_lat, lng: data.location_lng, heading: data.heading || 0 });
           }
        };
        fetchLatestLoc();
        
        const sub = supabase.channel(`loc_${selectedDelivery.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'delivery_locations', filter: `delivery_id=eq.${selectedDelivery.id}` }, (payload) => {
                const data = payload.new;
                setVolunteerLocation({ lat: data.location_lat, lng: data.location_lng, heading: data.heading || 0 });
            }).subscribe();
            
        return () => { supabase.removeChannel(sub); };
    }, [selectedDelivery?.id]);

    useEffect(() => {
        if (!selectedDelivery || !selectedDelivery.restaurant || !selectedDelivery.ngo || !window.google) return;
        
        const origin = { lat: Number(selectedDelivery.donations?.pickup_lat || selectedDelivery.restaurant?.location_lat || selectedDelivery.restaurant?.latitude || 19.0760), lng: Number(selectedDelivery.donations?.pickup_lng || selectedDelivery.restaurant?.location_lng || selectedDelivery.restaurant?.longitude || 72.8777) };
        const dest = { lat: Number(selectedDelivery.ngo?.location_lat || selectedDelivery.ngo?.latitude || 19.0760), lng: Number(selectedDelivery.ngo?.location_lng || selectedDelivery.ngo?.longitude || 72.8777) };
        
        if (!origin.lat || !origin.lng || !dest.lat || !dest.lng) return;
        
        // Adjust start/end of route based on status
        let start = origin;
        let end = dest;
        if (volunteerLocation) {
           if (['heading_to_restaurant', 'arrived_restaurant'].includes(selectedDelivery.status)) {
               start = volunteerLocation;
               end = origin;
           } else if (['picked_up', 'heading_to_ngo', 'arrived_ngo'].includes(selectedDelivery.status)) {
               start = volunteerLocation;
               end = dest;
           }
        }
        
        if (!window.google?.maps?.DirectionsService) return;
        const directionsService = new window.google.maps.DirectionsService();
        return; // Disabled due to missing Directions API
        directionsService.route({
            origin: start,
            destination: end,
            travelMode: window.google?.maps?.TravelMode?.DRIVING || 'DRIVING'
        }, (result, status) => {
            if (status === 'OK' && result) {
                setDirections(result);
            }
        });
    }, [selectedDelivery, volunteerLocation?.lat, volunteerLocation?.lng]);

    if (deliveries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <Truck className="w-16 h-16 text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-700">No Active Deliveries</h2>
                <p className="text-slate-500 mt-2">There are currently no active deliveries to track.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
            <div className="w-full lg:w-[350px] flex flex-col gap-4 overflow-y-auto pr-2">
                <h2 className="font-bold text-lg text-slate-900 dark:text-white sticky top-0 bg-slate-50 dark:bg-[#0a0a0a] py-2 z-10">Active Deliveries</h2>
                {deliveries.map(d => (
                    <Card 
                        key={d.id} 
                        className={`cursor-pointer transition-colors ${selectedDelivery?.id === d.id ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-md' : 'hover:border-slate-300'}`}
                        onClick={() => { setSelectedDelivery(d); setVolunteerLocation(null); setDirections(null); }}
                    >
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                    {d.status.replace(/_/g, ' ')}
                                </Badge>
                                <span className="text-xs text-slate-500">{new Date(d.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 truncate">{d.donations?.title}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{d.donations?.quantity_kg} {d.donations?.unit || 'Kg'}</p>
                            
                            <div className="space-y-1 text-xs text-slate-500">
                                <div className="flex items-center gap-1.5 truncate">
                                    <User className="w-3.5 h-3.5 shrink-0" /> Volunteer: {d.volunteer?.full_name || 'Assigned'}
                                </div>
                                <div className="flex items-center gap-1.5 truncate">
                                    <Building className="w-3.5 h-3.5 shrink-0" /> From: {d.restaurant?.business_name || d.restaurant?.full_name}
                                </div>
                                <div className="flex items-center gap-1.5 truncate">
                                    <MapPin className="w-3.5 h-3.5 shrink-0" /> To: {d.ngo?.organization_name}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden relative shadow-sm border border-slate-200 dark:border-slate-700">
                {selectedDelivery && selectedDelivery.restaurant && selectedDelivery.ngo && (
                    <APIProvider apiKey={API_KEY}>
                        <Map
                            defaultZoom={13}
                            defaultCenter={{ lat: Number(selectedDelivery.ngo?.location_lat || selectedDelivery.ngo?.latitude || 19.0760), lng: Number(selectedDelivery.ngo?.location_lng || selectedDelivery.ngo?.longitude || 72.8777) }}
                            mapId="track_map"
                            disableDefaultUI={true}
                        >
                            <DirectionsRenderer directions={directions} />
                            
                            {/* Restaurant Marker */}
                            <AdvancedMarker position={{ lat: Number(selectedDelivery.donations?.pickup_lat || selectedDelivery.restaurant?.location_lat || selectedDelivery.restaurant?.latitude || 19.0760), lng: Number(selectedDelivery.donations?.pickup_lng || selectedDelivery.restaurant?.location_lng || selectedDelivery.restaurant?.longitude || 72.8777) }}>
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-slate-800">
                                    <Building className="w-5 h-5 text-slate-800" />
                                </div>
                            </AdvancedMarker>

                            {/* NGO Marker */}
                            <AdvancedMarker position={{ lat: Number(selectedDelivery.ngo?.location_lat || selectedDelivery.ngo?.latitude || 19.0760), lng: Number(selectedDelivery.ngo?.location_lng || selectedDelivery.ngo?.longitude || 72.8777) }}>
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-blue-500">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                </div>
                            </AdvancedMarker>

                            {/* Volunteer Marker */}
                            {volunteerLocation && (
                                <AdvancedMarker position={{ lat: volunteerLocation.lat, lng: volunteerLocation.lng }}>
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl border-2 border-emerald-500 transition-transform duration-500" style={{ transform: `rotate(${volunteerLocation.heading}deg)` }}>
                                        <Truck className="w-5 h-5 text-emerald-600" />
                                    </div>
                                </AdvancedMarker>
                            )}
                        </Map>
                    </APIProvider>
                )}
                
                {/* Status Overlay */}
                {selectedDelivery && (
                   <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/95 dark:bg-[#111113]/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-4">
                      <div className="flex justify-between items-center mb-3">
                         <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Current Status</p>
                            <p className="font-bold text-emerald-600">{selectedDelivery.status.replace(/_/g, ' ').toUpperCase()}</p>
                         </div>
                         {directions?.routes?.[0]?.legs?.[0] && (
                            <div className="text-right">
                               <p className="text-xs font-bold text-slate-500 uppercase">ETA</p>
                               <p className="font-bold text-slate-900 dark:text-white">{directions.routes[0].legs[0].duration?.text}</p>
                            </div>
                         )}
                      </div>
                      
                      {profile?.role === 'ngo' && ['arrived_ngo'].includes(selectedDelivery.status) && (
                         <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-500 mb-1">Provide this Delivery OTP to volunteer:</p>
                            <p className="font-mono text-2xl font-bold tracking-widest text-center text-slate-900 dark:text-white">{selectedDelivery.delivery_otp}</p>
                         </div>
                      )}
                      
                      {profile?.role === 'donor' && ['arrived_restaurant'].includes(selectedDelivery.status) && (
                         <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-500 mb-1">Provide this Pickup OTP to volunteer:</p>
                            <p className="font-mono text-2xl font-bold tracking-widest text-center text-slate-900 dark:text-white">{selectedDelivery.pickup_otp}</p>
                         </div>
                      )}
                   </div>
                )}
            </div>
        </div>
    );
}
