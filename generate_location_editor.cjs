const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Navigation2, CheckCircle2, AlertCircle, Map as MapIcon, Loader2, Link as LinkIcon, Crosshair, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

export interface LocationData {
  address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number | string | null;
  longitude: number | string | null;
}

interface Props {
  data: LocationData;
  onChange: (updates: Partial<LocationData>) => void;
  onSave?: (mergedData: LocationData) => Promise<void>;
}

async function osmReverseGeocode(lat: number, lng: number) {
    const res = await fetch(\`https://nominatim.openstreetmap.org/reverse?lat=\${lat}&lon=\${lng}&format=json&addressdetails=1\`, {
        headers: { 'Accept-Language': 'en' }
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return {
        address: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village || data.address?.county || '',
        state: data.address?.state || '',
        postal_code: data.address?.postcode || '',
        lat,
        lng
    };
}

function LocationPickerModal({ open, onOpenChange, onConfirm }: { open: boolean, onOpenChange: (open: boolean) => void, onConfirm: (data: LocationData) => void }) {
    const [isLocating, setIsLocating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [pastedUrl, setPastedUrl] = useState('');
    const [isResolving, setIsResolving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleCurrentLocation = () => {
        setErrorMsg('');
        if (!navigator.geolocation) {
            setErrorMsg("Geolocation is not supported by your browser.");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const result = await osmReverseGeocode(latitude, longitude);
                    onConfirm({
                        address: result.address,
                        city: result.city,
                        state: result.state,
                        postal_code: result.postal_code,
                        latitude,
                        longitude
                    });
                    onOpenChange(false);
                } catch (e) {
                    setErrorMsg("Could not reverse geocode your location.");
                } finally {
                    setIsLocating(false);
                }
            },
            (error) => {
                setIsLocating(false);
                setErrorMsg("Permission denied or unable to retrieve location.");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleGoogleMapsSearch = () => {
        if (!searchQuery.trim()) {
            window.open('https://www.google.com/maps', '_blank');
        } else {
            window.open(\`https://www.google.com/maps/search/?api=1&query=\${encodeURIComponent(searchQuery)}\`, '_blank');
        }
    };

    const handleImportUrl = async () => {
        setErrorMsg('');
        if (!pastedUrl.trim()) return;
        setIsResolving(true);
        try {
            const res = await fetch('/api/resolve-maps-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: pastedUrl })
            });
            const data = await res.json();
            if (data.lat && data.lng) {
                // Reverse geocode
                const result = await osmReverseGeocode(data.lat, data.lng);
                onConfirm({
                    address: result.address,
                    city: result.city,
                    state: result.state,
                    postal_code: result.postal_code,
                    latitude: data.lat,
                    longitude: data.lng
                });
                onOpenChange(false);
            } else {
                setErrorMsg("This Google Maps link cannot be imported automatically. Please use 'Use Current Location' or search for another place.");
            }
        } catch (e) {
            setErrorMsg("This Google Maps link cannot be imported automatically. Please use 'Use Current Location' or search for another place.");
        } finally {
            setIsResolving(false);
        }
    };

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setSearchQuery('');
            setPastedUrl('');
            setErrorMsg('');
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DialogHeader className="p-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <DialogTitle className="text-xl">Choose Location</DialogTitle>
                    <DialogDescription>
                        Select your location using one of the methods below.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="p-6 space-y-8">
                    {/* Option 1 */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Option 1: Use Current Location</h3>
                        <p className="text-sm text-slate-500">Automatically get your coordinates and address using your device's GPS.</p>
                        <Button 
                            onClick={handleCurrentLocation} 
                            disabled={isLocating}
                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm flex items-center justify-center gap-2 text-base"
                        >
                            {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crosshair className="w-5 h-5" />}
                            {isLocating ? 'Locating...' : 'Use Current Location'}
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 font-medium">Or</span>
                        </div>
                    </div>

                    {/* Option 2 */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Option 2: Search on Google Maps</h3>
                        
                        <div className="flex gap-2">
                            <Input 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Enter building or place name..."
                                className="h-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                            />
                            <Button 
                                onClick={handleGoogleMapsSearch}
                                variant="outline"
                                className="h-12 px-6 rounded-xl border-slate-200 dark:border-slate-700 shrink-0 gap-2 font-medium text-slate-700 dark:text-slate-300"
                            >
                                <Search className="w-4 h-4" /> Search
                            </Button>
                        </div>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 text-sm text-blue-800 dark:text-blue-300">
                            When you have selected your location in Google Maps, click <strong>Share</strong> → <strong>Copy Link</strong> and return to UniteMeal.
                        </div>

                        <div className="space-y-2 pt-2">
                            <Label>Paste Google Maps Link Here</Label>
                            <div className="flex gap-2">
                                <Input 
                                    value={pastedUrl}
                                    onChange={(e) => setPastedUrl(e.target.value)}
                                    placeholder="https://maps.app.goo.gl/..."
                                    className="h-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                                />
                                <Button 
                                    onClick={handleImportUrl}
                                    disabled={isResolving || !pastedUrl.trim()}
                                    className="h-12 px-6 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shrink-0"
                                >
                                    {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Import'}
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    {errorMsg && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2 border border-red-100 dark:border-red-900/30">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p>{errorMsg}</p>
                        </div>
                    )}
                </div>
                
                <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function LocationEditor({ data, onChange, onSave }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const viewCurrentMap = () => {
        if (data.latitude && data.longitude) {
            window.open(\`https://www.google.com/maps?q=\${data.latitude},\${data.longitude}\`, '_blank');
        }
    };

    return (
        <div className="space-y-6">
            <Button 
                type="button" 
                onClick={() => setIsModalOpen(true)} 
                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white shadow-sm flex items-center justify-center gap-2 text-base font-medium"
            >
                <MapIcon className="w-5 h-5" /> Choose Location
            </Button>
            
            <LocationPickerModal 
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onConfirm={async (newData) => {
                    onChange(newData);
                    if (onSave) {
                        const mergedData = { ...data, ...newData };
                        await onSave(mergedData);
                    }
                }}
            />

            <div className="space-y-4 pt-2">
                <div className="space-y-2">
                    <Label className="text-[13px] text-slate-500 font-medium">Complete Address</Label>
                    <Textarea 
                        value={data.address || ''} 
                        onChange={(e) => onChange({ address: e.target.value })} 
                        placeholder="Address"
                        className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl resize-none min-h-[80px]" 
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[13px] text-slate-500 font-medium">City</Label>
                        <Input value={data.city || ''} onChange={(e) => onChange({ city: e.target.value })} className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 h-10 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[13px] text-slate-500 font-medium">State</Label>
                        <Input value={data.state || ''} onChange={(e) => onChange({ state: e.target.value })} className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 h-10 rounded-xl" />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label className="text-[13px] text-slate-500 font-medium">PIN Code</Label>
                    <Input value={data.postal_code || ''} onChange={(e) => onChange({ postal_code: e.target.value })} className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 h-10 rounded-xl max-w-[200px]" />
                </div>
                
                {/* Advanced Accordion */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button 
                        type="button" 
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        Advanced
                    </button>
                    
                    {showAdvanced && (
                        <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="space-y-2">
                                <Label className="text-[13px] text-slate-500 font-medium">Latitude</Label>
                                <Input value={data.latitude || ''} onChange={(e) => onChange({ latitude: e.target.value })} className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 h-10 rounded-xl font-mono text-xs" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[13px] text-slate-500 font-medium">Longitude</Label>
                                <Input value={data.longitude || ''} onChange={(e) => onChange({ longitude: e.target.value })} className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 h-10 rounded-xl font-mono text-xs" />
                            </div>
                        </div>
                    )}
                </div>

                {data.latitude && data.longitude && (
                    <div className="pt-2">
                        <Button type="button" onClick={viewCurrentMap} variant="outline" className="w-full sm:w-auto px-6 h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1C1C1E] text-slate-700 dark:text-slate-300 shadow-sm">
                            <MapPin className="w-4 h-4 mr-2 text-indigo-500" /> View Map
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
`

fs.writeFileSync('src/components/dashboard/LocationEditor.tsx', code);
