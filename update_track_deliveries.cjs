const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, Clock, Building, Truck, CheckCircle2, User, Play, StopCircle, Share2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

function DirectionsRenderer({ directions }: { directions: google.maps.DirectionsResult }) {
    const map = useMap();
    const [renderer, setRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

    useEffect(() => {
        if (!map || !window.google) return;
        const newRenderer = new window.google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true,
            polylineOptions: { strokeColor: '#3b82f6', strokeWeight: 5 } // Blue route
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
    
    const fetchDeliveries = async () => {
        if (!user || !profile) return;
        
        let query = supabase.from('delivery_tracking')
            .select('*, donations(*), restaurant:profiles!restaurant_id(*), ngo:profiles!ngo_id(*), ngo_volunteers(*)')
            .neq('status', 'completed')
            .order('updated_at', { ascending: false });
            
        if (profile.role === 'donor') {
            query = query.eq('restaurant_id', user.uid);
        } else {
            query = query.eq('ngo_id', user.uid);
        }
        
        const { data, error } = await query;
        if (error) console.error("Error fetching deliveries:", error);
            
        if (data) {
            setDeliveries(data);
            if (data.length > 0 && !selectedDelivery) {
                setSelectedDelivery(data[0]);
            } else if (selectedDelivery) {
                const updated = data.find(d => d.id === selectedDelivery.id);
                if (updated) setSelectedDelivery(updated);
            }
        }
    };
    
    useEffect(() => {
        fetchDeliveries();
        if (!user || !profile) return;
        
        const filter = profile.role === 'donor' ? \`restaurant_id=eq.\${user.uid}\` : \`ngo_id=eq.\${user.uid}\`;
        
        const sub = supabase.channel('tracking-dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_tracking', filter }, () => {
                fetchDeliveries();
            }).subscribe();
        return () => { supabase.removeChannel(sub); };
    }, [user, profile]);

    useEffect(() => {
        if (!selectedDelivery || !selectedDelivery.restaurant || !selectedDelivery.ngo || !window.google) return;
        
        // Draw route from restaurant to NGO
        const origin = { lat: Number(selectedDelivery.restaurant.latitude), lng: Number(selectedDelivery.restaurant.longitude) };
        const dest = { lat: Number(selectedDelivery.ngo.latitude), lng: Number(selectedDelivery.ngo.longitude) };
        
        if (!origin.lat || !origin.lng || !dest.lat || !dest.lng) return;
        
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route({
            origin: origin,
            destination: dest,
            travelMode: window.google.maps.TravelMode.DRIVING
        }, (result, status) => {
            if (status === 'OK' && result) {
                setDirections(result);
            }
        });
    }, [selectedDelivery?.restaurant?.latitude, selectedDelivery?.restaurant?.longitude, selectedDelivery?.ngo?.latitude, selectedDelivery?.ngo?.longitude]);

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'completed': return 'bg-slate-100 text-slate-700';
            case 'in_transit_to_ngo': return 'bg-blue-100 text-blue-700';
            case 'picked_up': return 'bg-emerald-100 text-emerald-700';
            case 'in_transit_to_restaurant': return 'bg-amber-100 text-amber-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Active Deliveries</h2>
                <p className="text-slate-500">Live track your volunteers and pickups.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                    {deliveries.length === 0 ? (
                        <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center h-full min-h-[300px]">
                            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                                <Truck className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 mb-1">No active deliveries</h3>
                            <p className="text-sm text-slate-500 max-w-[200px] text-center">There are currently no active deliveries assigned or in transit.</p>
                        </div>
                    ) : (
                        deliveries.map(delivery => (
                            <Card 
                                key={delivery.id} 
                                className={\`cursor-pointer transition-colors \${selectedDelivery?.id === delivery.id ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/30' : 'hover:border-slate-300'}\`}
                                onClick={() => setSelectedDelivery(delivery)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-sm line-clamp-1">
                                            {profile?.role === 'donor' ? delivery.ngo?.full_name : delivery.restaurant?.full_name}
                                        </h3>
                                        <Badge variant="secondary" className={\`capitalize text-[10px] whitespace-nowrap \${getStatusColor(delivery.status)}\`}>
                                            {delivery.status.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-1 mb-1">{delivery.donations?.title || delivery.donations?.food_name}</p>
                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 shrink-0 overflow-hidden">
                                                {delivery.ngo_volunteers?.profile_photo ? (
                                                    <img src={delivery.ngo_volunteers.profile_photo} className="w-full h-full object-cover" />
                                                ) : <User className="w-3 h-3" />}
                                            </div>
                                            <span className="text-xs font-medium">{delivery.ngo_volunteers?.name || 'Unassigned'}</span>
                                        </div>
                                        {delivery.eta_minutes && (
                                            <div className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                                {delivery.eta_minutes} min
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
                
                <div className="lg:col-span-2 space-y-4">
                    {selectedDelivery ? (
                        <Card className="overflow-hidden border-slate-200 shadow-sm">
                            <CardContent className="p-0 flex flex-col">
                                <div className="h-[400px] bg-slate-100 relative">
                                    <APIProvider apiKey={API_KEY}>
                                        <Map 
                                            defaultZoom={14} 
                                            defaultCenter={{lat: 19.0760, lng: 72.8777}}
                                            mapId="delivery_tracking_map"
                                            disableDefaultUI={true}
                                        >
                                            {directions && <DirectionsRenderer directions={directions} />}
                                            
                                            {selectedDelivery.current_latitude && selectedDelivery.current_longitude && (
                                                <AdvancedMarker position={{lat: Number(selectedDelivery.current_latitude), lng: Number(selectedDelivery.current_longitude)}} zIndex={50}>
                                                    <div className="relative group cursor-pointer">
                                                        <div className="w-12 h-12 rounded-full border-2 border-emerald-500 shadow-xl overflow-hidden bg-white p-1">
                                                            <img src="/delivery_boy.jpeg" className="w-full h-full rounded-full object-cover" style={{ transform: \`rotate(\${selectedDelivery.heading || 0}deg)\`, transition: 'transform 1s ease-out' }} />
                                                        </div>
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 shadow-xl flex flex-col items-center">
                                                            <span className="text-emerald-400">{selectedDelivery.ngo_volunteers?.name}</span>
                                                            {(selectedDelivery.eta_minutes || selectedDelivery.distance_remaining) && (
                                                                <span className="text-[10px] text-slate-300">ETA: {selectedDelivery.eta_minutes} mins • {selectedDelivery.distance_remaining}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </AdvancedMarker>
                                            )}
                                            
                                            {selectedDelivery.restaurant && (
                                                <AdvancedMarker position={{lat: Number(selectedDelivery.restaurant.latitude), lng: Number(selectedDelivery.restaurant.longitude)}}>
                                                    <div className="w-8 h-8 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center shadow-lg">
                                                        <MapPin className="w-4 h-4 text-white" />
                                                    </div>
                                                </AdvancedMarker>
                                            )}
                                            
                                            {selectedDelivery.ngo && (
                                                <AdvancedMarker position={{lat: Number(selectedDelivery.ngo.latitude), lng: Number(selectedDelivery.ngo.longitude)}}>
                                                    <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-lg">
                                                        <Building className="w-4 h-4 text-white" />
                                                    </div>
                                                </AdvancedMarker>
                                            )}
                                        </Map>
                                    </APIProvider>
                                </div>
                                
                                <div className="p-6 bg-white">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                                                {selectedDelivery.ngo_volunteers?.profile_photo ? (
                                                    <img src={selectedDelivery.ngo_volunteers?.profile_photo} className="w-full h-full object-cover" />
                                                ) : <User className="w-6 h-6 text-slate-400" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{selectedDelivery.ngo_volunteers?.name || 'Unassigned'}</h3>
                                                <p className="text-sm text-slate-500">{selectedDelivery.ngo_volunteers?.phone || 'No phone'}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-slate-900 mb-1">Status</div>
                                            <Badge className={\`capitalize \${getStatusColor(selectedDelivery.status)}\`}>
                                                {selectedDelivery.status.replace(/_/g, ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                                        <div>
                                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> ETA</div>
                                            <div className="font-bold text-xl">{selectedDelivery.eta_minutes ? \`\${selectedDelivery.eta_minutes} min\` : '--'}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Navigation className="w-3 h-3" /> Distance</div>
                                            <div className="font-bold text-xl">{selectedDelivery.distance_remaining || '--'}</div>
                                        </div>
                                        <div className="flex justify-end items-center">
                                            <Button variant="outline" className="gap-2 w-full" onClick={() => window.open(\`/volunteer/\${selectedDelivery.id}\`, '_blank')}>
                                                <Share2 className="w-4 h-4" /> Share Tracking
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    {/* Status Timeline */}
                                    <div className="mt-8 pt-6 border-t border-slate-100">
                                        <h4 className="text-sm font-bold mb-4">Delivery Timeline</h4>
                                        <div className="flex justify-between items-center relative">
                                            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 -z-10 -translate-y-1/2"></div>
                                            
                                            {/* Step 1: Assigned */}
                                            <div className="flex flex-col items-center gap-2">
                                                <div className={\`w-6 h-6 rounded-full flex items-center justify-center text-white \${['waiting', 'in_transit_to_restaurant', 'picked_up', 'in_transit_to_ngo', 'completed'].includes(selectedDelivery.status) ? 'bg-emerald-500' : 'bg-slate-300'}\`}>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                                <span className="text-[10px] font-medium">Assigned</span>
                                            </div>
                                            
                                            {/* Step 2: To Restaurant */}
                                            <div className="flex flex-col items-center gap-2">
                                                <div className={\`w-6 h-6 rounded-full flex items-center justify-center text-white \${['in_transit_to_restaurant', 'picked_up', 'in_transit_to_ngo', 'completed'].includes(selectedDelivery.status) ? 'bg-emerald-500' : 'bg-slate-300'}\`}>
                                                    <Truck className="w-3 h-3" />
                                                </div>
                                                <span className="text-[10px] font-medium">To Restaurant</span>
                                            </div>
                                            
                                            {/* Step 3: Picked Up */}
                                            <div className="flex flex-col items-center gap-2">
                                                <div className={\`w-6 h-6 rounded-full flex items-center justify-center text-white \${['picked_up', 'in_transit_to_ngo', 'completed'].includes(selectedDelivery.status) ? 'bg-emerald-500' : 'bg-slate-300'}\`}>
                                                    <Building className="w-3 h-3" />
                                                </div>
                                                <span className="text-[10px] font-medium">Picked Up</span>
                                            </div>
                                            
                                            {/* Step 4: To NGO */}
                                            <div className="flex flex-col items-center gap-2">
                                                <div className={\`w-6 h-6 rounded-full flex items-center justify-center text-white \${['in_transit_to_ngo', 'completed'].includes(selectedDelivery.status) ? 'bg-emerald-500' : 'bg-slate-300'}\`}>
                                                    <Navigation className="w-3 h-3" />
                                                </div>
                                                <span className="text-[10px] font-medium">To NGO</span>
                                            </div>
                                            
                                            {/* Step 5: Delivered */}
                                            <div className="flex flex-col items-center gap-2">
                                                <div className={\`w-6 h-6 rounded-full flex items-center justify-center text-white \${['completed'].includes(selectedDelivery.status) ? 'bg-emerald-500' : 'bg-slate-300'}\`}>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                                <span className="text-[10px] font-medium">Delivered</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="h-[400px] flex items-center justify-center bg-slate-50 border-dashed">
                            <div className="text-center text-slate-400">
                                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Select a delivery to view tracking</p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
`;

fs.writeFileSync('src/pages/TrackDeliveriesContent.tsx', code);
console.log("Updated TrackDeliveriesContent.tsx");
