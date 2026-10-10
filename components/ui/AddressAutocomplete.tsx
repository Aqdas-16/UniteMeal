import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface AddressAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onPlaceSelect: (place: any) => void;
    disabled?: boolean;
    className?: string;
}

export function AddressAutocompleteInput({ value, onChange, onPlaceSelect, disabled, className }: AddressAutocompleteProps) {
    const placesLib = useMapsLibrary('places');
    const geocodingLib = useMapsLibrary('geocoding');
    
    const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
    const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
    const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
    
    const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (placesLib && !autocompleteService) {
            setAutocompleteService(new placesLib.AutocompleteService());
            const dummyEl = document.createElement('div');
            setPlacesService(new placesLib.PlacesService(dummyEl));
        }
        if (geocodingLib && !geocoder) {
            setGeocoder(new geocodingLib.Geocoder());
        }
    }, [placesLib, autocompleteService, geocodingLib, geocoder]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchPredictions = useCallback((input: string) => {
        if (!autocompleteService || !input) {
            setSuggestions([]);
            return;
        }
        
        autocompleteService.getPlacePredictions({ input }, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                setSuggestions(results);
                setIsOpen(true);
                setErrorMsg('');
            } else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
                setErrorMsg('not available now, enter manually all details like address and longitude latitude from google maps. sorry for inconveinence.');
                setSuggestions([]);
                setIsOpen(true);
            } else {
                setSuggestions([]);
            }
        });
    }, [autocompleteService]);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);
        if (val.length > 2) {
            fetchPredictions(val);
        } else {
            setSuggestions([]);
            setIsOpen(false);
            setErrorMsg('');
        }
    };

    const handleSelect = (suggestion: google.maps.places.AutocompletePrediction) => {
        onChange(suggestion.description);
        setIsOpen(false);
        setErrorMsg('');
        
        if (geocoder) {
            geocoder.geocode({ placeId: suggestion.place_id }, (results, status) => {
                if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                    const result = {
                        id: suggestion.place_id,
                        displayName: suggestion.description,
                        formattedAddress: results[0].formatted_address,
                        location: {
                            lat: () => results[0].geometry.location.lat(),
                            lng: () => results[0].geometry.location.lng()
                        },
                        address_components: results[0].address_components
                    };
                    onPlaceSelect(result);
                }
            });
        }
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <Input 
                value={value}
                onChange={handleInput}
                disabled={disabled}
                className={className}
                placeholder="Enter address..."
            />
            {isOpen && (suggestions.length > 0 || errorMsg) && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#161618] border border-slate-200 dark:border-slate-800 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {errorMsg ? (
                        <div className="p-3 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20">
                            {errorMsg}
                        </div>
                    ) : (
                        suggestions.map((suggestion) => (
                            <div 
                                key={suggestion.place_id}
                                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 last:border-0"
                                onClick={() => handleSelect(suggestion)}
                            >
                                {suggestion.description}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
