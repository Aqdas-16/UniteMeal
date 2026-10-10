import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Building, MapPin, Clock, Box, Shield, Utensils, 
    Scale, Phone, AlertCircle, Navigation, Info, CheckCircle2, Sparkles 
} from 'lucide-react';
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { MapProvider as APIProvider } from '@/src/components/MapProvider';

export function DonationDetailsModal({ 
    isOpen, onClose, donation, onAccept, ngoLoc 
}: { 
    isOpen: boolean, onClose: () => void, donation: any, onAccept: () => void, ngoLoc: any 
}) {
    if (!donation) return null;
    
    const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    
    // Calculate distance
    let distanceStr = 'Nearby';
    if (ngoLoc && donation.profiles?.latitude && donation.profiles?.longitude) {
        const R = 6371;
        const dLat = (Number(donation.profiles.latitude) - ngoLoc.lat) * Math.PI / 180;
        const dLon = (Number(donation.profiles.longitude) - ngoLoc.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                  Math.cos(ngoLoc.lat * Math.PI / 180) * 
                  Math.cos(Number(donation.profiles.latitude) * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distanceStr = (R * c).toFixed(1) + ' km away';
    }

    const mapCenter = { 
        lat: Number(donation.pickup_latitude || donation.pickup_lat || donation.profiles?.latitude || 0), 
        lng: Number(donation.pickup_longitude || donation.pickup_lng || donation.profiles?.longitude || 0) 
    };

    const hasAI = donation.food_quality_assessments && donation.food_quality_assessments.length > 0;
    const aiData = hasAI ? donation.food_quality_assessments[0] : null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden bg-white dark:bg-[#0A0A0A] border-slate-200 dark:border-slate-800 shadow-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Donation Details</DialogTitle>
                    <DialogDescription>Review food and pickup information before accepting.</DialogDescription>
                </DialogHeader>

                {/* Sticky Header with Provider Info */}
                <div className="bg-slate-50 dark:bg-[#111111] px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white dark:bg-[#161616] border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                            {donation.profiles?.avatar_url ? (
                                <img src={donation.profiles.avatar_url} className="w-full h-full object-cover" alt="Provider" />
                            ) : (
                                <Building className="w-5 h-5 text-slate-400" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">
                                {donation.profiles?.restaurant_name || donation.profiles?.business_name || donation.profiles?.full_name || 'Restaurant Provider'}
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5 text-[12px] text-slate-500 font-medium">
                                <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                    <span className="text-amber-500 text-[14px]">★</span> 4.8
                                </span>
                                <span>•</span>
                                <span>{distanceStr}</span>
                            </div>
                        </div>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 capitalize font-semibold shadow-none">
                        {donation.status?.replace('_', ' ') || 'Available'}
                    </Badge>
                </div>

                {/* Scrollable Body */}
                <div className="overflow-y-auto max-h-[70vh]">
                    <div className="grid md:grid-cols-[1.3fr_1fr] divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800/80">
                        
                        {/* LEFT COLUMN: Food Details */}
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Utensils className="w-4 h-4 text-slate-400" />
                                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Donation Content</h3>
                            </div>
                            
                            {/* Feature Image */}
                            <div className="w-full aspect-[21/9] rounded-xl bg-slate-50 dark:bg-[#161616] border border-slate-100 dark:border-slate-800 overflow-hidden mb-5">
                                {donation.donation_images?.[0]?.image_url ? (
                                    <img src={donation.donation_images[0].image_url} className="w-full h-full object-cover" alt="Food" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-emerald-600/50 dark:text-emerald-500/30">
                                        <Box className="w-10 h-10 mb-2" />
                                        <span className="text-xs font-medium">No image provided</span>
                                    </div>
                                )}
                            </div>

                            {/* Title & Tags */}
                            <div className="mb-6">
                                <h4 className="font-semibold text-xl text-slate-900 dark:text-white mb-2 leading-tight">
                                    {donation.title || donation.food_name || donation.food_category}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                        {donation.food_category || 'Mixed Category'}
                                    </Badge>
                                    <Badge variant="outline" className="text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                        {donation.food_type || 'Mixed Diet'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-slate-50 dark:bg-[#111111] border border-slate-100 dark:border-slate-800/80 rounded-xl p-3">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <Scale className="w-3 h-3" /> Yield
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {donation.quantity_kg ? `${donation.quantity_kg} kg` : `Qty: ${donation.quantity}`} 
                                        {donation.estimated_meals && <span className="text-slate-400 font-normal ml-1">({donation.estimated_meals} meals)</span>}
                                    </p>
                                </div>
                                <div className="bg-slate-50 dark:bg-[#111111] border border-slate-100 dark:border-slate-800/80 rounded-xl p-3">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" /> Expiry
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {new Date(donation.expiry_time || donation.pickup_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>

                            {/* AI Analysis (Clean Variant) */}
                            {hasAI && (
                                <div className="rounded-xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 p-4 mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-indigo-500" />
                                            <span className="text-[12px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">AI Quality Check</span>
                                        </div>
                                        {aiData.authenticity_result?.includes('Passed') && (
                                            <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 rounded-full">
                                                <CheckCircle2 className="w-3 h-3" /> Verified
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-[12px] mb-1.5">
                                                <span className="text-indigo-800/70 dark:text-indigo-300/70 font-medium">Freshness Score</span>
                                                <span className="text-indigo-900 dark:text-indigo-200 font-semibold">{aiData.freshness_score || 0}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-indigo-100 dark:bg-indigo-950 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${aiData.freshness_score || 0}%` }} />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-[12px]">
                                            <span className="text-indigo-800/70 dark:text-indigo-300/70 font-medium">Spoilage Risk</span>
                                            <span className={`font-semibold ${aiData.spoilage_risk === 'High' ? 'text-red-600 dark:text-red-400' : aiData.spoilage_risk === 'Medium' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                {aiData.spoilage_risk || 'Unknown'}
                                            </span>
                                        </div>
                                        {aiData.explanation && (
                                            <p className="text-[12px] leading-relaxed text-indigo-800/80 dark:text-indigo-200/80 bg-white/60 dark:bg-black/20 p-2.5 rounded-lg border border-indigo-100/50 dark:border-indigo-500/10">
                                                {aiData.explanation}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* RIGHT COLUMN: Logistics & Map */}
                        <div className="p-6 bg-[#FAFAFA] dark:bg-[#0A0A0A]">
                            <div className="flex items-center gap-2 mb-4">
                                <Navigation className="w-4 h-4 text-slate-400" />
                                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Logistics & Location</h3>
                            </div>

                            {/* Map Container */}
                            <div className="h-[220px] w-full rounded-xl bg-slate-100 dark:bg-[#161616] border border-slate-200 dark:border-slate-800 overflow-hidden mb-5 relative shadow-inner">
                                {API_KEY && mapCenter.lat ? (
                                    <APIProvider apiKey={API_KEY}>
                                        <Map
                                            defaultCenter={mapCenter}
                                            defaultZoom={15}
                                            disableDefaultUI={true}
                                            mapId="donation_details_map"
                                        >
                                            <AdvancedMarker position={mapCenter}>
                                                <Pin background={'#10B981'} borderColor={'#047857'} glyphColor={'#fff'} />
                                            </AdvancedMarker>
                                        </Map>
                                    </APIProvider>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                        <MapPin className="w-8 h-8 mb-2 opacity-50" />
                                        <span className="text-xs font-medium">Map unavailable</span>
                                    </div>
                                )}
                            </div>

                            {/* Location Details */}
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/20">
                                        <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Address</p>
                                        <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                            {donation.pickup_address || donation.profiles?.address || 'Address not provided'}
                                        </p>
                                    </div>
                                </div>

                                {donation.profiles?.phone_number && (
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                                            <Phone className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Contact</p>
                                            <p className="text-[13px] text-slate-700 dark:text-slate-300 font-medium">
                                                {donation.profiles.phone_number}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                {donation.instructions && (
                                    <div className="flex gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                        <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-500/20">
                                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Instructions</p>
                                            <p className="text-[13px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                                {donation.instructions}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="bg-white dark:bg-[#0A0A0A] p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                    <p className="text-[12px] text-slate-500 hidden sm:flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" /> Please confirm you can meet the expiry timeframe.
                    </p>
                    <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                        <Button variant="outline" onClick={onClose} className="h-10 px-5 text-[13px] font-semibold border-slate-200 dark:border-slate-800 bg-transparent flex-1 sm:flex-none">
                            Cancel
                        </Button>
                        <Button onClick={() => { onClose(); onAccept(); }} className="h-10 px-8 text-[13px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex-1 sm:flex-none transition-colors">
                            Accept Pickup
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}