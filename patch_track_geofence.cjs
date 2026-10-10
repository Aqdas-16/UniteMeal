const fs = require('fs');
let code = fs.readFileSync('src/pages/TrackDeliveriesContent.tsx', 'utf8');

if (!code.includes('getDistanceFromLatLonInKm')) {
   const geoFunc = `
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}
`;
   code = code.replace(/export function TrackDeliveriesContent\(\) \{/, geoFunc + '\nexport function TrackDeliveriesContent() {');
}

// Add state for tracking geofence notifications to avoid spamming
if (!code.includes('geofenceState')) {
   code = code.replace(/const \[dbLocation, setDbLocation\] = useState[^\n]+;/g, `$&
  const [geofenceState, setGeofenceState] = useState<Record<string, string>>({});`);
}

// Add the geofence logic in the watchPosition callback
const watchPosCode = `
    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, speed, heading } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        await supabase.from('tracking_locations').upsert({
          pickup_task_id: taskId,
          team_member_id: teamId,
          latitude,
          longitude,
          speed,
          heading,
          updated_at: new Date().toISOString()
        }, { onConflict: 'pickup_task_id' });

        // Geofencing Logic
        const task = tasks.find(t => t.id === taskId);
        if (task && task.status === 'on_the_way') {
           const restLat = Number(task.donations?.pickup_lat || task.profiles?.location_lat || 0);
           const restLng = Number(task.donations?.pickup_lng || task.profiles?.location_lng || 0);
           
           if (restLat && restLng) {
               const distKm = getDistanceFromLatLonInKm(latitude, longitude, restLat, restLng);
               const distMeters = distKm * 1000;
               
               const currentState = geofenceState[taskId] || 'none';
               
               if (distMeters <= 50 && currentState !== 'arrived') {
                   // Auto arrive
                   await updateStatus(task, 'arrived');
                   setGeofenceState(prev => ({...prev, [taskId]: 'arrived'}));
               } else if (distMeters <= 300 && currentState !== 'nearby' && currentState !== 'arrived') {
                   // Notify nearby
                   setGeofenceState(prev => ({...prev, [taskId]: 'nearby'}));
                   toast.info("You are within 300m! Notifying restaurant...");
                   await supabase.from('notifications').insert([
                     {
                       user_id: task.restaurant_id,
                       title: 'Volunteer Nearby',
                       message: 'The volunteer is within 300 meters and arriving shortly.',
                       type: 'delivery_update',
                       related_entity_id: task.donation_id,
                       related_entity_type: 'delivery'
                     },
                     {
                       user_id: task.ngo_id,
                       title: 'Volunteer Nearby',
                       message: 'Your volunteer is arriving at the restaurant.',
                       type: 'delivery_update',
                       related_entity_id: task.donation_id,
                       related_entity_type: 'delivery'
                     }
                   ]);
               }
           }
        }
      },
`;

code = code.replace(/const id = navigator\.geolocation\.watchPosition\([\s\S]*?updated_at: new Date\(\)\.toISOString\(\)\s*\}, \{ onConflict: 'pickup_task_id' \}\);\s*\},/m, watchPosCode.trim());

fs.writeFileSync('src/pages/TrackDeliveriesContent.tsx', code);
