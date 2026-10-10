const fs = require('fs');

const code = `import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    const geocodingLib = useMapsLibrary('geocoding');
    const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (geocodingLib && !geocoder) {
            setGeocoder(new geocodingLib.Geocoder());
        }
    }, [geocodingLib, geocoder]);

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
        if (!geocoder || !input) {
            setSuggestions([]);
            return;
        }
        
        geocoder.geocode({ address: input }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results) {
                setSuggestions(results);
                setIsOpen(true);
            } else {
                setSuggestions([]);
            }
        });
    }, [geocoder]);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);
        if (val.length > 2) {
            fetchPredictions(val);
        } else {
            setSuggestions([]);
            setIsOpen(false);
        }
    };

    const handleSelect = (suggestion: google.maps.GeocoderResult) => {
        onChange(suggestion.formatted_address);
        setIsOpen(false);
        
        const result = {
            id: suggestion.place_id,
            displayName: suggestion.formatted_address,
            formattedAddress: suggestion.formatted_address,
            location: {
                lat: () => suggestion.geometry.location.lat(),
                lng: () => suggestion.geometry.location.lng()
            }
        };
        onPlaceSelect(result);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <Input 
                id="address"
                value={value}
                onChange={handleInput}
                onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
                disabled={disabled}
                className={className}
                placeholder="Search your location..."
                autoComplete="off"
            />
            
            {isOpen && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((suggestion, index) => (
                        <li 
                            key={index}
                            className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 last:border-0"
                            onClick={() => handleSelect(suggestion)}
                        >
                            <div className="font-medium">{suggestion.formatted_address}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
`;

fs.writeFileSync('components/ui/AddressAutocomplete.tsx', code);
console.log('Replaced AddressAutocomplete.tsx');
