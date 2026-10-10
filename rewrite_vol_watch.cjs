const fs = require('fs');
let code = fs.readFileSync('src/pages/VolunteerDashboard.tsx', 'utf8');

const regex = /        const watchCall = Geolocation\.watchPosition\([\s\S]*?    \}, \[tracking\?\.status, trackingId, restaurant, ngo\]\);/;

const replacement = `        let id: string | null = null;
        
        const startWatching = async () => {
            try {
                const permission = await Geolocation.checkPermissions();
                if (permission.location !== 'granted') {
                    await Geolocation.requestPermissions();
                }
                
                id = await Geolocation.watchPosition(
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
                    (pos, err) => {
                        if (err || !pos) {
                            console.error(err);
                            return;
                        }
                        const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        
                        // Keep references for Distance Matrix
                        let currentStatus = tracking?.status;
                        let rest = restaurant;
                        let n = ngo;
                        
                        setLocation(prev => {
                            let heading = 0;
                            if (prev) {
                                heading = getBearing(prev.lat, prev.lng, newLoc.lat, newLoc.lng);
                            }
                            
                            let updateData: any = {
                                current_latitude: newLoc.lat, 
                                current_longitude: newLoc.lng,
                                heading: heading,
                                updated_at: new Date().toISOString()
                            };

                            // Try to update ETA via DistanceMatrix API if possible
                            if (window.google && currentStatus && rest && n) {
                                let dest = null;
                                if (['waiting', 'accepted', 'heading_to_restaurant', 'in_transit_to_restaurant'].includes(currentStatus)) {
                                    dest = { lat: Number(rest.latitude || rest.location_lat), lng: Number(rest.longitude || rest.location_lng) };
                                } else if (['picked_up', 'heading_to_ngo', 'in_transit_to_ngo'].includes(currentStatus)) {
                                    dest = { lat: Number(n.latitude), lng: Number(n.longitude) };
                                }

                                if (dest && dest.lat && dest.lng) {
                                    const service = new window.google.maps.DistanceMatrixService();
                                    service.getDistanceMatrix({
                                        origins: [newLoc],
                                        destinations: [dest],
                                        travelMode: window.google.maps.TravelMode.DRIVING
                                    }, (response, status) => {
                                        if (status === 'OK' && response && response.rows[0].elements[0].status === 'OK') {
                                            const element = response.rows[0].elements[0];
                                            const etaMins = Math.round(element.duration.value / 60);
                                            const dist = element.distance.text;
                                            
                                            updateData.eta_minutes = etaMins;
                                            updateData.distance_remaining = dist;
                                        }
                                        // Update Supabase (inside callback)
                                        supabase.from('delivery_tracking')
                                            .update(updateData)
                                            .eq('id', trackingId)
                                            .then();
                                    });
                                    return newLoc;
                                }
                            }

                            // Update Supabase (fallback if no dest)
                            supabase.from('delivery_tracking')
                                .update(updateData)
                                .eq('id', trackingId)
                                .then();
                                
                            return newLoc;
                        });
                    }
                );
            } catch (e) {
                console.error("Error starting geolocation watch:", e);
            }
        };

        startWatching();
        
        return () => {
            if (id) {
                Geolocation.clearWatch({ id });
            }
        };
    }, [tracking?.status, trackingId, restaurant, ngo]);`;

code = code.replace(
    /        const watchCall = Geolocation\.watchPosition\([\s\S]*?    \}, \[tracking\?\.status, trackingId, restaurant, ngo\]\);/,
    replacement
);

fs.writeFileSync('src/pages/VolunteerDashboard.tsx', code);
console.log("Rewritten watchPosition in VolunteerDashboard.tsx");
