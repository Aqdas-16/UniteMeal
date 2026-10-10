const fs = require('fs');
let code = fs.readFileSync('./components/ui/AddressAutocomplete.tsx', 'utf8');

const target = `    const fetchPredictions = useCallback(async (input: string) => {
        if (!places || !input || !sessionToken) {
            setSuggestions([]);
            return;
        }

        try {
            const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
                input,
                sessionToken
            });
            setSuggestions(suggestions || []);
            setIsOpen(true);
        } catch (error: any) {
            console.warn("API Autocomplete warning:", error.message);
            setSuggestions([]);
        }
    }, [places, sessionToken]);`;

const replacement = `    const fetchPredictions = useCallback(async (input: string) => {
        if (!places || !input || !sessionToken) {
            setSuggestions([]);
            return;
        }

        try {
            const service = new places.AutocompleteService();
            service.getPlacePredictions({
                input,
                sessionToken
            }, (predictions, status) => {
                if (status === places.PlacesServiceStatus.OK && predictions) {
                    setSuggestions(predictions);
                    setIsOpen(true);
                } else {
                    setSuggestions([]);
                }
            });
        } catch (error: any) {
            console.warn("API Autocomplete warning:", error.message);
            setSuggestions([]);
        }
    }, [places, sessionToken]);`;

code = code.replace(target, replacement);

const targetSelect = `    const handleSelect = async (suggestion: any) => {
        if (!places || !suggestion.placePrediction) return;
        
        onChange(suggestion.placePrediction.text.text);
        setIsOpen(false);
        
        try {
            const place = suggestion.placePrediction.toPlace();
            try {
                await place.fetchFields({
                    fields: ['displayName', 'formattedAddress', 'location', 'id']
                });
            } catch (fetchError) {
                console.warn("API Place Details warning:", fetchError);
            }
            
            // Generate a new session token for the next search
            setSessionToken(new places.AutocompleteSessionToken());
            
            onPlaceSelect(place);
        } catch (error) {
            console.warn("Error processing place selection:", error);
        }
    };`;

const replacementSelect = `    const handleSelect = async (suggestion: any) => {
        if (!places || !suggestion.place_id) return;
        
        onChange(suggestion.description);
        setIsOpen(false);
        
        try {
            const geocoder = new google.maps.Geocoder();
            const placesService = new places.PlacesService(document.createElement('div'));
            
            placesService.getDetails({
                placeId: suggestion.place_id,
                fields: ['name', 'formatted_address', 'geometry', 'place_id', 'address_components'],
                sessionToken
            }, (place, status) => {
                if (status === places.PlacesServiceStatus.OK && place && place.geometry && place.geometry.location) {
                    // Create object similar to what original component expects
                    const result = {
                        id: place.place_id,
                        displayName: place.name,
                        formattedAddress: place.formatted_address,
                        location: {
                            lat: () => place.geometry.location.lat(),
                            lng: () => place.geometry.location.lng()
                        },
                        addressComponents: place.address_components
                    };
                    onPlaceSelect(result);
                    setSessionToken(new places.AutocompleteSessionToken());
                } else {
                    console.warn("Could not fetch place details", status);
                }
            });
        } catch (error) {
            console.warn("Error processing place selection:", error);
        }
    };`;
    
code = code.replace(targetSelect, replacementSelect);

const targetRender = `                            <div className="font-medium">{suggestion.placePrediction?.text?.text}</div>`;
const replacementRender = `                            <div className="font-medium">{suggestion.description}</div>`;
code = code.replace(targetRender, replacementRender);

fs.writeFileSync('./components/ui/AddressAutocomplete.tsx', code);
