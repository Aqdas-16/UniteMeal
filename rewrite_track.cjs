const fs = require('fs');
const code = `import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin, CheckCircle, Navigation, Play, StopCircle } from 'lucide-react';
import { toast } from 'sonner';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

export function TrackDeliveriesContent() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [trackingId, setTrackingId] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // To view live location from DB if another device is tracking
  const [dbLocation, setDbLocation] = useState<{lat: number, lng: number} | null>(null);

  const fetchTasks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('pickup_tasks')
      .select('*, donations(*), profiles:restaurant_id(restaurant_name, phone, location_lat, location_lng), ngo_team(name, phone, vehicle_number)')
      .eq('ngo_id', user.uid)
      .not('status', 'in', '("completed", "cancelled")')
      .order('created_at', { ascending: false });
      
    if (data) {
      setTasks(data);
      // Update selected task if it exists
      if (selectedTask) {
        const updated = data.find((t: any) => t.id === selectedTask.id);
        if (updated) setSelectedTask(updated);
      }
    }
  };

  useEffect(() => {
    fetchTasks();
    const channel = supabase.channel('tracking-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pickup_tasks', filter: \`ngo_id=eq.\${user?.uid}\` }, fetchTasks)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Listen for DB location updates for the selected task
  useEffect(() => {
    if (!selectedTask) return;
    
    // Fetch initial
    const fetchLoc = async () => {
      const { data } = await supabase.from('tracking_locations').select('*').eq('pickup_task_id', selectedTask.id).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (data) setDbLocation({ lat: Number(data.latitude), lng: Number(data.longitude) });
    };
    fetchLoc();
    
    const channel = supabase.channel('live-tracking')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracking_locations', filter: \`pickup_task_id=eq.\${selectedTask.id}\` }, (payload) => {
        const newLoc = payload.new as any;
        if (newLoc) {
          setDbLocation({ lat: Number(newLoc.latitude), lng: Number(newLoc.longitude) });
        }
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [selectedTask]);

  const updateStatus = async (task: any, newStatus: string) => {
    try {
      const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
      
      if (newStatus === 'on_the_way') updates.started_at = new Date().toISOString();
      if (newStatus === 'arrived') updates.arrived_at = new Date().toISOString();
      if (newStatus === 'picked_up') updates.picked_up_at = new Date().toISOString();
      if (newStatus === 'completed') updates.completed_at = new Date().toISOString();

      await supabase.from('pickup_tasks').update(updates).eq('id', task.id);
      
      // Also update donation status if needed
      if (newStatus === 'completed') {
         await supabase.from('donations').update({ status: 'completed' }).eq('id', task.donation_id);
      } else if (newStatus === 'picked_up') {
         await supabase.from('donations').update({ status: 'picked_up' }).eq('id', task.donation_id);
      }
      
      // Notify restaurant
      await supabase.from('notifications').insert({
        user_id: task.restaurant_id,
        title: \`Pickup \${newStatus.replace('_', ' ')}\`,
        message: \`Your donation pickup is now \${newStatus.replace('_', ' ')}.\`,
        type: 'pickup_update',
        link_id: task.donation_id
      });
      
      toast.success(\`Status updated to \${newStatus.replace('_', ' ')}\`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleLocationSharing = (taskId: string, teamId: string) => {
    if (trackingId !== null) {
      navigator.geolocation.clearWatch(trackingId);
      setTrackingId(null);
      toast.success("Location sharing stopped");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    toast.success("Location sharing started");
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
      },
      (error) => toast.error(error.message),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
    setTrackingId(id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Live Tracking & Pickups</h2>
        <p className="text-slate-500">Manage active pickups, update statuses, and share live location.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4 max-h-[80vh] overflow-y-auto pr-2">
          {tasks.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed rounded-lg border-slate-200">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No active pickups</h3>
            </div>
          ) : (
            tasks.map(task => (
              <Card 
                key={task.id} 
                className={\`cursor-pointer transition-colors \${selectedTask?.id === task.id ? 'border-emerald-500 ring-1 ring-emerald-500' : 'hover:border-slate-300'}\`}
                onClick={() => setSelectedTask(task)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-sm">{task.profiles?.restaurant_name}</h3>
                    <Badge variant="outline" className="capitalize">{task.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{task.donations?.title || task.donations?.food_name}</p>
                  <p className="text-xs text-slate-500 mt-1">Assigned: {task.ngo_team?.name}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        <div className="lg:col-span-2 space-y-4">
          {selectedTask ? (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="h-[300px] bg-slate-100 relative">
                  {API_KEY && (
                    <APIProvider apiKey={API_KEY}>
                      <Map
                        defaultZoom={13}
                        defaultCenter={{
                          lat: Number(selectedTask.profiles?.location_lat || selectedTask.donations?.pickup_lat || selectedTask.donations?.latitude || 19.076),
                          lng: Number(selectedTask.profiles?.location_lng || selectedTask.donations?.pickup_lng || selectedTask.donations?.longitude || 72.877)
                        }}
                        mapId="tracking_map_id"
                        disableDefaultUI={true}
                      >
                        {/* Restaurant Location */}
                        <AdvancedMarker position={{
                          lat: Number(selectedTask.profiles?.location_lat || selectedTask.donations?.pickup_lat || selectedTask.donations?.latitude || 0),
                          lng: Number(selectedTask.profiles?.location_lng || selectedTask.donations?.pickup_lng || selectedTask.donations?.longitude || 0)
                        }}>
                          <Pin background={'#ef4444'} borderColor={'#b91c1c'} glyphColor={'#fff'} />
                        </AdvancedMarker>
                        
                        {/* Live Tracking Location */}
                        {(currentLocation || dbLocation) && (
                          <AdvancedMarker position={currentLocation || dbLocation as any}>
                            <Pin background={'#3b82f6'} borderColor={'#1d4ed8'} glyphColor={'#fff'} />
                          </AdvancedMarker>
                        )}
                      </Map>
                    </APIProvider>
                  )}
                </div>
                
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4">Pickup Workflow</h3>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                     <Button 
                       variant={selectedTask.status === 'assigned' ? 'default' : 'outline'}
                       onClick={() => updateStatus(selectedTask, 'on_the_way')}
                       disabled={selectedTask.status !== 'assigned'}
                     >
                       Start Journey
                     </Button>
                     <Button 
                       variant={selectedTask.status === 'on_the_way' ? 'default' : 'outline'}
                       onClick={() => updateStatus(selectedTask, 'arrived')}
                       disabled={selectedTask.status !== 'on_the_way'}
                     >
                       Arrived
                     </Button>
                     <Button 
                       variant={selectedTask.status === 'arrived' ? 'default' : 'outline'}
                       onClick={() => updateStatus(selectedTask, 'picked_up')}
                       disabled={selectedTask.status !== 'arrived'}
                     >
                       Picked Up
                     </Button>
                     <Button 
                       variant={selectedTask.status === 'picked_up' ? 'default' : 'outline'}
                       onClick={() => updateStatus(selectedTask, 'completed')}
                       disabled={selectedTask.status !== 'picked_up'}
                     >
                       Delivered (Complete)
                     </Button>
                  </div>
                  
                  <div className="border-t border-slate-100 pt-4 flex justify-between items-center bg-slate-50 p-4 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-sm">Live Location Sharing</h4>
                      <p className="text-xs text-slate-500">Share location from this device (for team member on the field)</p>
                    </div>
                    <Button 
                      variant={trackingId ? "destructive" : "default"}
                      onClick={() => toggleLocationSharing(selectedTask.id, selectedTask.team_member_id)}
                    >
                      {trackingId ? <><StopCircle className="w-4 h-4 mr-2"/> Stop Sharing</> : <><Play className="w-4 h-4 mr-2"/> Share Location</>}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg border-slate-200 min-h-[400px]">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">Select a pickup</h3>
                <p className="text-slate-500">Click a task on the left to view details and map.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/ui/TrackDeliveriesContent.tsx', code);
