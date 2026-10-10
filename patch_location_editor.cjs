const fs = require('fs');
let code = `import React, { useState, useEffect, useRef } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin, Crosshair, Loader2, AlertCircle } from "lucide-react";

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
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

async function googleGeocode(query: string) {
    if (!API_KEY) throw new Error("Google Maps API key not found.");
    const res = await fetch(\`https://maps.googleapis.com/maps/api/geocode/json?address=\${encodeURIComponent(query)}&key=\${API_KEY}\`);
    const data = await res.json();
    if (data.status === 'OK' && data.results && data.results.length > 0) {
        const d = data.results[0];
        let city = '';
        let state = '';
        let postal_code = '';
        
        for (const component of d.address_components) {
            if (component.types.includes('locality')) {
                city = component.long_name;
            } else if (component.types.includes('administrative_area_level_2') && !city) {
                city = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
                state = component.long_name;
            }
            if (component.types.includes('postal_code')) {
                postal_code = component.long_name;
            }
        }

        return {
            lat: d.geometry.location.lat,
            lng: d.geometry.location.lng,
            address: d.formatted_address,
            city,
            state,
            postal_code
        };
    }
    throw new Error(data.error_message || data.status || "Geocoding failed.");
}

async function googleReverseGeocode(lat: number, lng: number) {
    if (!API_KEY) throw new Error("Google Maps API key not found.");
    const res = await fetch(\`https://maps.googleapis.com/maps/api/geocode/json?latlng=\${lat},\${lng}&key=\${API_KEY}\`);
    const data = await res.json();
    if (data.status === 'OK' && data.results && data.results.length > 0) {
        const d = data.results[0];
        let city = '';
        let state = '';
        let postal_code = '';
        
        for (const component of d.address_components) {
            if (component.types.includes('locality')) {
                city = component.long_name;
            } else if (component.types.includes('administrative_area_level_2') && !city) {
                city = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
                state = component.long_name;
            }
            if (component.types.includes('postal_code')) {
                postal_code = component.long_name;
            }
        }

        return {
            address: d.formatted_address,
            city,
            state,
            postal_code,
            lat,
            lng
        };
    }
    throw new Error(data.error_message || data.status || "Reverse geocoding failed.");
}

export function LocationEditor({ data, onChange }: Props) {
    const [isLocating, setIsLocating] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [status, setStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

    // Local state for inputs to allow smooth typing
    const [addressInput, setAddressInput] = useState(data.address || '');
    const [latInput, setLatInput] = useState(data.latitude?.toString() || '');
    const [lngInput, setLngInput] = useState(data.longitude?.toString() || '');

    // Ref to prevent infinite loops during auto-sync
    const skipNextSync = useRef(false);

    // Sync from props to local state if external changes happen (like loading data)
    useEffect(() => {
        if (!skipNextSync.current) {
            setAddressInput(data.address || '');
            setLatInput(data.latitude?.toString() || '');
            setLngInput(data.longitude?.toString() || '');
        }
    }, [data.address, data.latitude, data.longitude]);

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
                    const result = await googleReverseGeocode(latitude, longitude);
                    
                    skipNextSync.current = true;
                    setAddressInput(result.address);
                    setLatInput(latitude.toString());
                    setLngInput(longitude.toString());
                    
                    onChange({
                        address: result.address,
                        city: result.city,
                        state: result.state,
                        postal_code: result.postal_code,
                        latitude,
                        longitude
                    });
                    setStatus('synced');
                    setTimeout(() => { skipNextSync.current = false; }, 100);
                } catch (e: any) {
                    // Fallback to manual if geocoding fails (e.g. no key)
                    console.error(e);
                    skipNextSync.current = true;
                    setLatInput(latitude.toString());
                    setLngInput(longitude.toString());
                    onChange({
                        latitude,
                        longitude
                    });
                    setErrorMsg("Location found, but automatic address lookup failed. Please enter address manually.");
                    setStatus('error');
                    setTimeout(() => { skipNextSync.current = false; }, 100);
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

    // Auto-sync: Address -> Coordinates
    useEffect(() => {
        if (skipNextSync.current || !addressInput) return;
        
        // Only run if address changed manually and is different from data.address
        if (addressInput === data.address) return;

        const delayFn = setTimeout(async () => {
            setStatus('syncing');
            try {
                const result = await googleGeocode(addressInput);
                if (result) {
                    skipNextSync.current = true;
                    setLatInput(result.lat.toString());
                    setLngInput(result.lng.toString());
                    onChange({
                        address: addressInput,
                        city: result.city,
                        state: result.state,
                        postal_code: result.postal_code,
                        latitude: result.lat,
                        longitude: result.lng
                    });
                    setStatus('synced');
                    setTimeout(() => { skipNextSync.current = false; }, 100);
                }
            } catch (e) {
                console.error(e);
                setStatus('error');
                onChange({ address: addressInput });
            }
        }, 1200);

        return () => clearTimeout(delayFn);
    }, [addressInput]);

    // Auto-sync: Coordinates -> Address
    useEffect(() => {
        if (skipNextSync.current || !latInput || !lngInput) return;
        
        if (latInput === data.latitude?.toString() && lngInput === data.longitude?.toString()) return;

        const delayFn = setTimeout(async () => {
            const lat = parseFloat(latInput);
            const lng = parseFloat(lngInput);
            
            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                setStatus('error');
                setErrorMsg("Invalid coordinates.");
                onChange({ latitude: latInput, longitude: lngInput });
                return;
            }

            setStatus('syncing');
            try {
                const result = await googleReverseGeocode(lat, lng);
                skipNextSync.current = true;
                setAddressInput(result.address);
                onChange({
                    address: result.address,
                    city: result.city,
                    state: result.state,
                    postal_code: result.postal_code,
                    latitude: lat,
                    longitude: lng
                });
                setStatus('synced');
                setTimeout(() => { skipNextSync.current = false; }, 100);
            } catch (e) {
                console.error(e);
                setStatus('error');
                onChange({ latitude: latInput, longitude: lngInput });
            }
        }, 1200);

        return () => clearTimeout(delayFn);
    }, [latInput, lngInput]);

    const viewCurrentMap = () => {
        if (data.latitude && data.longitude) {
            window.open(\`https://www.google.com/maps?q=\${data.latitude},\${data.longitude}\`, '_blank');
        }
    };

    return (
        <div className="space-y-5">
            <Button 
                type="button" 
                onClick={handleCurrentLocation} 
                disabled={isLocating}
                className="w-full sm:w-auto h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center justify-center gap-2 text-sm font-medium"
            >
                {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
                {isLocating ? 'Locating...' : 'Use Current Location'}
            </Button>
            
            {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2 border border-red-100 dark:border-red-900/30">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>{errorMsg}</p>
                </div>
            )}
            
            {status === 'syncing' && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Syncing location...</span>
                </div>
            )}

            <div className="space-y-4 pt-1">
                <div className="space-y-2">
                    <Label className="text-[13px] text-slate-500 font-medium">Complete Address</Label>
                    <Textarea 
                        value={addressInput} 
                        onChange={(e) => {
                            skipNextSync.current = false;
                            setAddressInput(e.target.value);
                            setStatus('idle');
                            setErrorMsg('');
                            onChange({ address: e.target.value });
                        }} 
                        placeholder="Enter full address..."
                        className="bg-white dark:bg-[#161618] border-slate-200 dark:border-slate-800 rounded-xl resize-none min-h-[80px]" 
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[13px] text-slate-500 font-medium">City</Label>
                        <Input value={data.city || ''} onChange={(e) => onChange({ city: e.target.value })} className="bg-white dark:bg-[#161618] border-slate-200 dark:border-slate-800 h-10 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[13px] text-slate-500 font-medium">State</Label>
                        <Input value={data.state || ''} onChange={(e) => onChange({ state: e.target.value })} className="bg-white dark:bg-[#161618] border-slate-200 dark:border-slate-800 h-10 rounded-xl" />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label className="text-[13px] text-slate-500 font-medium">PIN Code</Label>
                    <Input value={data.postal_code || ''} onChange={(e) => onChange({ postal_code: e.target.value })} className="bg-white dark:bg-[#161618] border-slate-200 dark:border-slate-800 h-10 rounded-xl sm:max-w-[200px]" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[13px] text-slate-500 font-medium">Latitude</Label>
                        <Input 
                            value={latInput} 
                            onChange={(e) => {
                                skipNextSync.current = false;
                                setLatInput(e.target.value);
                                setStatus('idle');
                                setErrorMsg('');
                                onChange({ latitude: e.target.value });
                            }} 
                            placeholder="e.g. 19.0760" 
                            className="bg-white dark:bg-[#161618] border-slate-200 dark:border-slate-800 h-10 rounded-xl font-mono text-xs" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[13px] text-slate-500 font-medium">Longitude</Label>
                        <Input 
                            value={lngInput} 
                            onChange={(e) => {
                                skipNextSync.current = false;
                                setLngInput(e.target.value);
                                setStatus('idle');
                                setErrorMsg('');
                                onChange({ longitude: e.target.value });
                            }} 
                            placeholder="e.g. 72.8777" 
                            className="bg-white dark:bg-[#161618] border-slate-200 dark:border-slate-800 h-10 rounded-xl font-mono text-xs" 
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <Button 
                        type="button" 
                        onClick={viewCurrentMap} 
                        variant="outline" 
                        disabled={!data.latitude || !data.longitude} 
                        className="w-full sm:w-auto px-6 h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1C1C1E] text-slate-700 dark:text-slate-300 shadow-sm"
                    >
                        <MapPin className="w-4 h-4 mr-2 text-indigo-500" /> View Map
                    </Button>
                </div>
            </div>
        </div>
    );
}
`;
fs.writeFileSync('src/components/dashboard/LocationEditor.tsx', code);
