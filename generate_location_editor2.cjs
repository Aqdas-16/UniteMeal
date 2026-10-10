const fs = require('fs');

const code = `import React, { useState, useEffect, useRef, useCallback } from 'react';
const originalConsoleError = console.error;
console.error = (...args) => {
    if (typeof args[0] === 'string' && (args[0].includes('Geocoding Service: You must enable Billing') || args[0].includes('Google Maps JavaScript API warning'))) {
        return;
    }
    originalConsoleError(...args);
};

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Navigation2, CheckCircle2, AlertCircle, Map as MapIcon, Loader2 } from "lucide-react";
import { APIProvider, Map, AdvancedMarker, useMapsLibrary, useMap } from '@vis.gl/react-google-maps';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
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

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || '';

interface LocationData {
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

async function osmGeocode(query: string) {
    const res = await fetch(\`https://nominatim.openstreetmap.org/search?q=\${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5\`);
    const data = await res.json();
    return data.map((d: any) => ({
        place_id: d.place_id,
        description: d.display_name,
        lat: parseFloat(d.lat),
        lng: parseFloat(d.lon),
        address: d.display_name,
        city: d.address?.city || d.address?.town || d.address?.village || '',
        state: d.address?.state || '',
        postal_code: d.address?.postcode || ''
    }));
}

async function osmReverseGeocode(lat: number, lng: number) {
    const res = await fetch(\`https://nominatim.openstreetmap.org/reverse?lat=\${lat}&lon=\${lng}&format=json&addressdetails=1\`);
    const data = await res.json();
    return {
        address: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village || '',
        state: data.address?.state || '',
        postal_code: data.address?.postcode || '',
        lat,
        lng
    };
}

// Leaflet map click and move handler
function LeafletMapController({ center, onLocationSelect }: { center: [number, number], onLocationSelect: (lat: number, lng: number) => void }) {
    const map = useLeafletMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        }
    });
    return null;
}

function LocationPickerModal({ open, onOpenChange, initialData, onSelect, geocoder, mapProvider, setMapProvider }: any) {
    const [mapLat, setMapLat] = useState(initialData.latitude ? parseFloat(initialData.latitude) : 19.0760);
    const [mapLng, setMapLng] = useState(initialData.longitude ? parseFloat(initialData.longitude) : 72.8777);
    
    const [currentAddress, setCurrentAddress] = useState(initialData.address || '');
    const [currentCity, setCurrentCity] = useState(initialData.city || '');
    const [currentState, setCurrentState] = useState(initialData.state || '');
    const [currentPin, setCurrentPin] = useState(initialData.postal_code || '');
    
    const [searchInput, setSearchInput] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const parseGoogleGeocode = (result: google.maps.GeocoderResult) => {
        let city = '';
        let state = '';
        let postal_code = '';
        for (const comp of result.address_components) {
            if (comp.types.includes('locality')) city = comp.long_name;
            if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
            if (comp.types.includes('postal_code')) postal_code = comp.long_name;
        }
        return { address: result.formatted_address, city, state, postal_code };
    };

    const doReverseGeocode = useCallback(async (lat: number, lng: number) => {
        setMapLat(lat);
        setMapLng(lng);
        setIsSearching(true);
        if (mapProvider === 'google' && geocoder) {
            try {
                geocoder.geocode({ location: { lat, lng } }, (results: any, apiStatus: any) => {
                    setIsSearching(false);
                    if (apiStatus === google.maps.GeocoderStatus.OK && results && results[0]) {
                        const parsed = parseGoogleGeocode(results[0]);
                        setCurrentAddress(parsed.address);
                        setCurrentCity(parsed.city);
                        setCurrentState(parsed.state);
                        setCurrentPin(parsed.postal_code);
                    } else {
                        setMapProvider('osm');
                        fallbackReverseGeocode(lat, lng);
                    }
                });
            } catch (e) {
                setMapProvider('osm');
                fallbackReverseGeocode(lat, lng);
            }
        } else {
            fallbackReverseGeocode(lat, lng);
        }
    }, [geocoder, mapProvider, setMapProvider]);

    const fallbackReverseGeocode = async (lat: number, lng: number) => {
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
    };

    // Debounced search
    useEffect(() => {
        const delayFn = setTimeout(() => {
            if (searchInput.length > 2) {
                if (mapProvider === 'google' && geocoder) {
                    geocoder.geocode({ address: searchInput }, (results: any, apiStatus: any) => {
                        if (apiStatus === google.maps.GeocoderStatus.OK && results) {
                            setSuggestions(results.map((r: any) => ({
                                place_id: r.place_id,
                                description: r.formatted_address,
                                data: r
                            })));
                        } else {
                            setMapProvider('osm');
                            fallbackSearch();
                        }
                    });
                } else {
                    fallbackSearch();
                }
            } else {
                setSuggestions([]);
            }
        }, 500);
        return () => clearTimeout(delayFn);
    }, [searchInput, geocoder, mapProvider]);

    const fallbackSearch = async () => {
        try {
            const results = await osmGeocode(searchInput);
            setSuggestions(results);
        } catch (e) {
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (s: any) => {
        setSuggestions([]);
        setSearchInput('');
        if (mapProvider === 'google' && s.data) {
            const lat = s.data.geometry.location.lat();
            const lng = s.data.geometry.location.lng();
            setMapLat(lat);
            setMapLng(lng);
            const parsed = parseGoogleGeocode(s.data);
            setCurrentAddress(parsed.address);
            setCurrentCity(parsed.city);
            setCurrentState(parsed.state);
            setCurrentPin(parsed.postal_code);
        } else if (mapProvider === 'osm') {
            setMapLat(s.lat);
            setMapLng(s.lng);
            setCurrentAddress(s.address);
            setCurrentCity(s.city);
            setCurrentState(s.state);
            setCurrentPin(s.postal_code);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden h-[90vh] md:h-[80vh] flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <DialogTitle>Choose Location</DialogTitle>
                </DialogHeader>
                
                <div className="flex-1 flex flex-col relative min-h-0">
                    {/* Search overlay */}
                    <div className="absolute top-4 left-4 right-4 z-[1000] max-w-md mx-auto">
                        <div className="relative">
                            <Input 
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search for area, street, or landmark..."
                                className="w-full bg-white dark:bg-slate-900 shadow-lg border-slate-200 dark:border-slate-700 h-12 pl-12 rounded-xl"
                            />
                            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        </div>
                        
                        {suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
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
                            </div>
                        )}
                    </div>

                    {/* Map Area */}
                    <div className="flex-1 relative bg-slate-100 dark:bg-slate-800">
                        {mapProvider === 'google' ? (
                            <Map
                                mapId="DEMO_MAP_ID"
                                defaultCenter={{ lat: mapLat, lng: mapLng }}
                                center={{ lat: mapLat, lng: mapLng }}
                                defaultZoom={15}
                                disableDefaultUI={true}
                                onClick={(e) => {
                                    if (e.detail.latLng) {
                                        doReverseGeocode(e.detail.latLng.lat, e.detail.latLng.lng);
                                    }
                                }}
                            >
                                <AdvancedMarker 
                                    position={{ lat: mapLat, lng: mapLng }} 
                                    draggable={true}
                                    onDragEnd={(e) => {
                                        if (e.latLng) {
                                            doReverseGeocode(e.latLng.lat(), e.latLng.lng());
                                        }
                                    }}
                                />
                            </Map>
                        ) : (
                            <MapContainer center={[mapLat, mapLng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <LeafletMapController center={[mapLat, mapLng]} onLocationSelect={(lat, lng) => doReverseGeocode(lat, lng)} />
                                <Marker 
                                    position={[mapLat, mapLng]} 
                                    draggable={true}
                                    eventHandlers={{
                                        dragend: (e) => {
                                            const marker = e.target;
                                            const pos = marker.getLatLng();
                                            doReverseGeocode(pos.lat, pos.lng);
                                        }
                                    }}
                                />
                            </MapContainer>
                        )}
                    </div>

                    {/* Bottom Details panel */}
                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
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

                <DialogFooter className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button 
                        onClick={() => {
                            onSelect({
                                address: currentAddress,
                                city: currentCity,
                                state: currentState,
                                postal_code: currentPin,
                                latitude: mapLat,
                                longitude: mapLng
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

function LocationEditorInner({ data, onChange }: Props) {
    const geocodingLib = useMapsLibrary('geocoding');
    const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
    const [mapProvider, setMapProvider] = useState<'google'|'osm'>(API_KEY ? 'google' : 'osm');
    
    const [addressInput, setAddressInput] = useState(data.address || '');
    const [latInput, setLatInput] = useState(data.latitude?.toString() || '');
    const [lngInput, setLngInput] = useState(data.longitude?.toString() || '');
    
    const [status, setStatus] = useState<'idle' | 'verified' | 'error' | 'unavailable'>('idle');
    const [statusMsg, setStatusMsg] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (geocodingLib) {
            setGeocoder(new geocodingLib.Geocoder());
        }
    }, [geocodingLib]);

    useEffect(() => {
        if (data.address !== addressInput) setAddressInput(data.address || '');
        if (data.latitude?.toString() !== latInput) setLatInput(data.latitude?.toString() || '');
        if (data.longitude?.toString() !== lngInput) setLngInput(data.longitude?.toString() || '');
    }, [data.address, data.latitude, data.longitude]);

    const parseGeocodeResult = (result: google.maps.GeocoderResult) => {
        let city = ''; let state = ''; let postal_code = '';
        for (const comp of result.address_components) {
            if (comp.types.includes('locality')) city = comp.long_name;
            if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
            if (comp.types.includes('postal_code')) postal_code = comp.long_name;
        }
        return { address: result.formatted_address, city, state, postal_code };
    };

    // Address manual edit effect
    useEffect(() => {
        const delayFn = setTimeout(async () => {
            if (addressInput && addressInput !== data.address) {
                if (mapProvider === 'google' && geocoder) {
                    geocoder.geocode({ address: addressInput }, (results, apiStatus) => {
                        if (apiStatus === google.maps.GeocoderStatus.OK && results && results[0]) {
                            const result = results[0];
                            const parsed = parseGeocodeResult(result);
                            const lat = result.geometry.location.lat();
                            const lng = result.geometry.location.lng();
                            onChange({
                                address: addressInput,
                                city: parsed.city,
                                state: parsed.state,
                                postal_code: parsed.postal_code,
                                latitude: lat,
                                longitude: lng
                            });
                            setStatus('verified');
                        } else {
                            setMapProvider('osm');
                        }
                    });
                } else if (mapProvider === 'osm') {
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
                                longitude: result.lng
                            });
                            setStatus('verified');
                        } else {
                            setStatus('error');
                            setStatusMsg("Address could not be verified.");
                        }
                    } catch (e) { }
                }
            }
        }, 800);
        return () => clearTimeout(delayFn);
    }, [addressInput, geocoder, mapProvider, data.address]);

    // Lat/Lng manual edit effect
    useEffect(() => {
        const delayFn = setTimeout(async () => {
            const lat = parseFloat(latInput);
            const lng = parseFloat(lngInput);
            if (!isNaN(lat) && !isNaN(lng) && (lat.toString() !== data.latitude?.toString() || lng.toString() !== data.longitude?.toString())) {
                if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                    setStatus('error');
                    setStatusMsg("Invalid coordinates.");
                    return;
                }
                if (mapProvider === 'google' && geocoder) {
                    geocoder.geocode({ location: { lat, lng } }, (results, apiStatus) => {
                        if (apiStatus === google.maps.GeocoderStatus.OK && results && results[0]) {
                            const parsed = parseGeocodeResult(results[0]);
                            onChange({
                                address: parsed.address,
                                city: parsed.city,
                                state: parsed.state,
                                postal_code: parsed.postal_code,
                                latitude: lat,
                                longitude: lng
                            });
                            setStatus('verified');
                        } else {
                            setMapProvider('osm');
                        }
                    });
                } else if (mapProvider === 'osm') {
                    try {
                        const result = await osmReverseGeocode(lat, lng);
                        onChange({
                            address: result.address,
                            city: result.city,
                            state: result.state,
                            postal_code: result.postal_code,
                            latitude: lat,
                            longitude: lng
                        });
                        setStatus('verified');
                    } catch (e) {
                        setStatus('error');
                        setStatusMsg("Coordinates could not be verified.");
                    }
                }
            }
        }, 800);
        return () => clearTimeout(delayFn);
    }, [latInput, lngInput, geocoder, mapProvider]);

    const viewCurrentMap = () => {
        if (data.latitude && data.longitude) {
            window.open(\`https://www.google.com/maps?q=\${data.latitude},\${data.longitude}\`, '_blank');
        } else if (data.address) {
            window.open(\`https://www.google.com/maps/search/?api=1&query=\${encodeURIComponent(data.address)}\`, '_blank');
        } else {
            window.open('https://www.google.com/maps', '_blank');
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
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
                    initialData={data}
                    onSelect={(updates: Partial<LocationData>) => {
                        onChange(updates);
                        setStatus('verified');
                    }}
                    geocoder={geocoder}
                    mapProvider={mapProvider}
                    setMapProvider={setMapProvider}
                />
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
                    <p className="text-sm text-red-500 font-medium flex items-center gap-1.5"><AlertCircle className="w-4 h-4"/> {statusMsg}</p>
                )}
                {status === 'verified' && data.latitude && (
                    <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Location verified
                    </div>
                )}
                
                <div className="pt-2">
                    <Button type="button" onClick={viewCurrentMap} variant="outline" className="w-full sm:w-auto px-6 h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1C1C1E] text-slate-700 dark:text-slate-300 shadow-sm">
                        <Navigation2 className="w-4 h-4 mr-2 text-indigo-500" /> View Map
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function LocationEditor(props: Props) {
    if (!API_KEY) {
        return <LocationEditorInner {...props} />;
    }
    return (
        <APIProvider apiKey={API_KEY} version="weekly">
            <LocationEditorInner {...props} />
        </APIProvider>
    );
}
`

fs.writeFileSync('src/components/dashboard/LocationEditor.tsx', code);
