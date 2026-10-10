const fs = require('fs');

const code = `import React, { useState, useEffect, useCallback } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Navigation2, CheckCircle2, AlertCircle, Map as MapIcon, Loader2, Link as LinkIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap as useLeafletMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationData {
  address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number | string | null;
  longitude: number | string | null;
  verification_status?: string;
}

interface Props {
  data: LocationData;
  onChange: (updates: Partial<LocationData>) => void;
}

async function osmGeocode(query: string) {
    const res = await fetch(\`https://nominatim.openstreetmap.org/search?q=\${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5\`, {
        headers: { 'Accept-Language': 'en' }
    });
    const data = await res.json();
    return data.map((d: any) => ({
        description: d.display_name,
        lat: parseFloat(d.lat),
        lng: parseFloat(d.lon),
        address: d.display_name,
        city: d.address?.city || d.address?.town || d.address?.village || d.address?.county || '',
        state: d.address?.state || '',
        postal_code: d.address?.postcode || ''
    }));
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

function LeafletMapController({ center, onLocationSelect }: { center: [number, number], onLocationSelect: (lat: number, lng: number) => void }) {
    const map = useLeafletMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    
    useMapEvents({
        dragend(e) {
            // we will handle marker drag instead of map drag
        }
    });
    return null;
}

function extractCoordinatesFromUrl(url: string) {
    const regex = /(?:@|q=|ll=)(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/;
    const match = url.match(regex);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    return null;
}

function LocationPickerModal({ open, onOpenChange, initialData, onSelect }: any) {
    const [mapLat, setMapLat] = useState(initialData.latitude ? parseFloat(initialData.latitude) : 20.5937);
    const [mapLng, setMapLng] = useState(initialData.longitude ? parseFloat(initialData.longitude) : 78.9629);
    
    const [currentAddress, setCurrentAddress] = useState(initialData.address || '');
    const [currentCity, setCurrentCity] = useState(initialData.city || '');
    const [currentState, setCurrentState] = useState(initialData.state || '');
    const [currentPin, setCurrentPin] = useState(initialData.postal_code || '');
    
    const [searchInput, setSearchInput] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [fallbackVisible, setFallbackVisible] = useState(false);

    const doReverseGeocode = useCallback(async (lat: number, lng: number) => {
        setMapLat(lat);
        setMapLng(lng);
        setIsSearching(true);
        try {
            const data = await osmReverseGeocode(lat, lng);
            setCurrentAddress(data.address);
            setCurrentCity(data.city);
            setCurrentState(data.state);
            setCurrentPin(data.postal_code);
        } catch (e) {
            console.error("OSM Reverse Geocode failed");
        }
        setIsSearching(false);
    }, []);

    useEffect(() => {
        const delayFn = setTimeout(async () => {
            if (searchInput.length > 2) {
                setIsSearching(true);
                try {
                    const results = await osmGeocode(searchInput);
                    setSuggestions(results);
                    setFallbackVisible(results.length === 0);
                } catch (e) {
                    setSuggestions([]);
                    setFallbackVisible(true);
                }
                setIsSearching(false);
            } else {
                setSuggestions([]);
                setFallbackVisible(false);
            }
        }, 500);
        return () => clearTimeout(delayFn);
    }, [searchInput]);

    const handleSuggestionClick = (s: any) => {
        setSuggestions([]);
        setSearchInput('');
        setMapLat(s.lat);
        setMapLng(s.lng);
        setCurrentAddress(s.address);
        setCurrentCity(s.city);
        setCurrentState(s.state);
        setCurrentPin(s.postal_code);
        setFallbackVisible(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden h-[90vh] md:h-[80vh] flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    <DialogTitle>Choose Location</DialogTitle>
                </DialogHeader>
                
                <div className="flex-1 flex flex-col relative min-h-0">
                    <div className="absolute top-4 left-4 right-4 z-[1000] max-w-md mx-auto">
                        <div className="relative">
                            <Input 
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search OpenStreetMap..."
                                className="w-full bg-white dark:bg-slate-900 shadow-lg border-slate-200 dark:border-slate-700 h-12 pl-12 rounded-xl"
                            />
                            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                            {isSearching && <Loader2 className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 animate-spin" />}
                        </div>
                        
                        {(suggestions.length > 0 || fallbackVisible) && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[300px] overflow-y-auto">
                                {suggestions.map((s, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => handleSuggestionClick(s)}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0 text-sm flex items-start gap-3"
                                    >
                                        <MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                                        <span className="text-slate-700 dark:text-slate-200">{s.description}</span>
                                    </button>
                                ))}
                                {fallbackVisible && (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-900/30 text-center">
                                        <p className="text-sm text-amber-800 dark:text-amber-300 mb-3 font-medium">We couldn\\'t find an accurate result. Search with Google Maps.</p>
                                        <Button 
                                            onClick={() => window.open(\`https://www.google.com/maps/search/?api=1&query=\${encodeURIComponent(searchInput)}\`, '_blank')}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                        >
                                            Search on Google Maps
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 relative bg-slate-100 dark:bg-slate-800">
                        <MapContainer center={[mapLat, mapLng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <LeafletMapController center={[mapLat, mapLng]} onLocationSelect={(lat, lng) => doReverseGeocode(lat, lng)} />
                            <Marker 
                                position={[mapLat, mapLng]} 
                                draggable={true}
                                eventHandlers={{
                                    dragend: (e) => {
                                        const pos = e.target.getLatLng();
                                        doReverseGeocode(pos.lat, pos.lng);
                                    }
                                }}
                            />
                        </MapContainer>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                        <div className="flex gap-4 items-start">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                                {isSearching ? <Loader2 className="w-6 h-6 animate-spin" /> : <MapPin className="w-6 h-6" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                                    {currentCity ? \`\${currentCity}, \${currentState}\` : 'Selected Location'}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                    {currentAddress || 'No address found. Drag marker to select.'}
                                </p>
                                <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-2">
                                    {mapLat.toFixed(6)}, {mapLng.toFixed(6)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button 
                        onClick={() => {
                            onSelect({
                                address: currentAddress,
                                city: currentCity,
                                state: currentState,
                                postal_code: currentPin,
                                latitude: mapLat,
                                longitude: mapLng,
                                verification_status: 'verified'
                            });
                            onOpenChange(false);
                        }}
                        className="bg-[#3FAE49] hover:bg-[#34963f] text-white"
                        disabled={isSearching || !currentAddress}
                    >
                        Use This Location
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function LocationEditor({ data, onChange }: Props) {
    const [addressInput, setAddressInput] = useState(data.address || '');
    const [latInput, setLatInput] = useState(data.latitude?.toString() || '');
    const [lngInput, setLngInput] = useState(data.longitude?.toString() || '');
    
    const [status, setStatus] = useState<'idle' | 'verified' | 'error'>('idle');
    const [statusMsg, setStatusMsg] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importUrl, setImportUrl] = useState('');
    const [importError, setImportError] = useState('');

    useEffect(() => {
        if (data.address !== addressInput) setAddressInput(data.address || '');
        if (data.latitude?.toString() !== latInput) setLatInput(data.latitude?.toString() || '');
        if (data.longitude?.toString() !== lngInput) setLngInput(data.longitude?.toString() || '');
        if (data.verification_status === 'verified') setStatus('verified');
        else if (data.latitude && data.longitude && data.address) setStatus('verified');
        else setStatus('idle');
    }, [data.address, data.latitude, data.longitude, data.verification_status]);

    // Address manual edit effect
    useEffect(() => {
        const delayFn = setTimeout(async () => {
            if (addressInput && addressInput !== data.address) {
                try {
                    const results = await osmGeocode(addressInput);
                    if (results.length > 0) {
                        const result = results[0];
                        onChange({
                            address: addressInput,
                            city: result.city,
                            state: result.state,
                            postal_code: result.postal_code,
                            latitude: result.lat,
                            longitude: result.lng,
                            verification_status: 'verified'
                        });
                        setStatus('verified');
                    } else {
                        setStatus('error');
                        setStatusMsg("Address could not be verified.");
                        onChange({ address: addressInput, verification_status: 'unverified' });
                    }
                } catch (e) {
                    setStatus('error');
                    setStatusMsg("Address verification failed.");
                    onChange({ address: addressInput, verification_status: 'unverified' });
                }
            }
        }, 800);
        return () => clearTimeout(delayFn);
    }, [addressInput, data.address]); // Intentionally omitting onChange to avoid infinite loop

    // Lat/Lng manual edit effect
    useEffect(() => {
        const delayFn = setTimeout(async () => {
            const lat = parseFloat(latInput);
            const lng = parseFloat(lngInput);
            if (!isNaN(lat) && !isNaN(lng) && (lat.toString() !== data.latitude?.toString() || lng.toString() !== data.longitude?.toString())) {
                if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                    setStatus('error');
                    setStatusMsg("Invalid coordinates.");
                    onChange({ latitude: lat, longitude: lng, verification_status: 'unverified' });
                    return;
                }
                try {
                    const result = await osmReverseGeocode(lat, lng);
                    onChange({
                        address: result.address,
                        city: result.city,
                        state: result.state,
                        postal_code: result.postal_code,
                        latitude: lat,
                        longitude: lng,
                        verification_status: 'verified'
                    });
                    setStatus('verified');
                } catch (e) {
                    setStatus('error');
                    setStatusMsg("Coordinates could not be verified.");
                    onChange({ latitude: lat, longitude: lng, verification_status: 'unverified' });
                }
            }
        }, 800);
        return () => clearTimeout(delayFn);
    }, [latInput, lngInput, data.latitude, data.longitude]);

    const handleImportUrl = async () => {
        setImportError('');
        const coords = extractCoordinatesFromUrl(importUrl);
        if (!coords) {
            setImportError("Could not extract coordinates from this link. Please ensure the link contains latitude and longitude (like /@lat,lng or ?q=lat,lng).");
            return;
        }
        
        try {
            const result = await osmReverseGeocode(coords.lat, coords.lng);
            onChange({
                address: result.address,
                city: result.city,
                state: result.state,
                postal_code: result.postal_code,
                latitude: coords.lat,
                longitude: coords.lng,
                verification_status: 'verified'
            });
            setStatus('verified');
            setIsImportModalOpen(false);
            setImportUrl('');
        } catch (e) {
            setImportError("Coordinates found, but reverse geocoding failed.");
        }
    };

    const viewCurrentMap = () => {
        if (data.latitude && data.longitude) {
            window.open(\`https://www.google.com/maps?q=\${data.latitude},\${data.longitude}\`, '_blank');
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                    type="button" 
                    onClick={() => setIsModalOpen(true)} 
                    className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white shadow-sm flex items-center justify-center gap-2 text-base font-medium"
                >
                    <MapIcon className="w-5 h-5" /> Choose Location
                </Button>
                
                <Button 
                    type="button" 
                    onClick={() => setIsImportModalOpen(true)} 
                    variant="outline"
                    className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-base font-medium"
                >
                    <LinkIcon className="w-5 h-5" /> Import Google Maps Link
                </Button>
                
                <LocationPickerModal 
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    initialData={data}
                    onSelect={(updates: Partial<LocationData>) => {
                        onChange(updates);
                        setStatus('verified');
                    }}
                />

                <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Import from Google Maps</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Label>Paste Google Maps Link</Label>
                            <Input 
                                value={importUrl} 
                                onChange={(e) => setImportUrl(e.target.value)} 
                                placeholder="e.g. https://www.google.com/maps/place/..."
                            />
                            {importError && <p className="text-sm text-red-500 font-medium">{importError}</p>}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleImportUrl}>Extract & Import</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-4 pt-2">
                <div className="space-y-2">
                    <Label className="text-[13px] text-slate-500 font-medium">Complete Address</Label>
                    <Textarea 
                        value={addressInput} 
                        onChange={(e) => setAddressInput(e.target.value)} 
                        placeholder="Enter full address..."
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
                
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[13px] text-slate-500 font-medium">PIN Code</Label>
                        <Input value={data.postal_code || ''} onChange={(e) => onChange({ postal_code: e.target.value })} className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 h-10 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[13px] text-slate-500 font-medium">Latitude</Label>
                        <Input value={latInput} onChange={(e) => setLatInput(e.target.value)} placeholder="e.g. 19.0760" className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 h-10 rounded-xl font-mono text-xs" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[13px] text-slate-500 font-medium">Longitude</Label>
                        <Input value={lngInput} onChange={(e) => setLngInput(e.target.value)} placeholder="e.g. 72.8777" className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 h-10 rounded-xl font-mono text-xs" />
                    </div>
                </div>

                {status === 'error' && (
                    <p className="text-sm text-red-500 font-medium flex items-center gap-1.5"><AlertCircle className="w-4 h-4"/> ⚠ Unable to verify this location. {statusMsg}</p>
                )}
                {status === 'verified' && data.latitude && data.longitude && (
                    <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-4 h-4" /> ✓ Verified Location
                    </div>
                )}
                
                <div className="pt-2">
                    <Button type="button" onClick={viewCurrentMap} variant="outline" disabled={!data.latitude || !data.longitude} className="w-full sm:w-auto px-6 h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1C1C1E] text-slate-700 dark:text-slate-300 shadow-sm">
                        <Navigation2 className="w-4 h-4 mr-2 text-indigo-500" /> View Map
                    </Button>
                </div>
            </div>
        </div>
    );
}
`

fs.writeFileSync('src/components/dashboard/LocationEditor.tsx', code);
