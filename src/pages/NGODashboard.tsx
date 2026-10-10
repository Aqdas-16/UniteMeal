import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Utensils, CheckCircle, Navigation, MapPin, Truck, AlertCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function NGODashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    availableDonations: 0,
    acceptedDonations: 0,
    completedPickups: 0,
    mealsSaved: 0,
    foodSavedKg: 0,
    nearbyRestaurants: 0,
    todaysPickups: 0,
    pendingRequests: 0,
  });
  
  useEffect(() => {
    if (!user) return;
    
    const fetchStats = async () => {
      // 1. Available Donations (status = 'available' or 'Available')
      const { data: available } = await supabase.from('donations').select('id').ilike('status', 'available');
      
      // 2. Accepted Donations (ngo_id = user.uid and status = 'accepted' or 'assigned')
      const { data: accepted } = await supabase.from('donations').select('id').eq('ngo_id', user.uid).in('status', ['accepted', 'assigned']);
      
      // 3. Completed Pickups (deliveries status = 'completed' where ngo_id = user.uid)
      const { data: completed } = await supabase.from('deliveries').select('id, donation_id').eq('ngo_id', user.uid).eq('status', 'completed');
      
      // 4. Meals and Food Saved
      const { data: completedDonations } = await supabase.from('donations').select('quantity_kg, estimated_meals').eq('ngo_id', user.uid).eq('status', 'completed');
      let totalKg = 0;
      let totalMeals = 0;
      if (completedDonations) {
          completedDonations.forEach(d => {
              totalKg += Number(d.quantity_kg || 0);
              totalMeals += Number(d.estimated_meals || (d.quantity_kg ? d.quantity_kg * 4 : 0));
          });
      }
      
      // 5. Nearby Restaurants (all active profiles with role = 'restaurant' / 'donor')
      // Let's just get count of donors for now.
      const { data: rests } = await supabase.from('profiles').select('id').eq('role', 'donor');
      
      // 6. Today's Pickups
      const today = new Date();
      today.setHours(0,0,0,0);
      const { data: todays } = await supabase.from('deliveries')
        .select('id')
        .eq('ngo_id', user.uid)
        .gte('assigned_at', today.toISOString());
        
      // 7. Pending Requests (if using food_requests or similar)
      const { data: requests } = await supabase.from('food_requests').select('id').eq('ngo_id', user.uid).eq('status', 'pending');

      setStats({
        availableDonations: available?.length || 0,
        acceptedDonations: accepted?.length || 0,
        completedPickups: completed?.length || 0,
        mealsSaved: totalMeals,
        foodSavedKg: totalKg,
        nearbyRestaurants: rests?.length || 0,
        todaysPickups: todays?.length || 0,
        pendingRequests: requests?.length || 0
      });
    };
    
    fetchStats();
    
    const channel1 = supabase.channel('ngo-dash-donations').on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, fetchStats).subscribe();
    const channel2 = supabase.channel('ngo-dash-tasks').on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, fetchStats).subscribe();
    const channel3 = supabase.channel('ngo-dash-requests').on('postgres_changes', { event: '*', schema: 'public', table: 'food_requests' }, fetchStats).subscribe();
    
    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
      supabase.removeChannel(channel3);
    };
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">NGO Dashboard</h1>
        <p className="text-slate-500">Overview of your food rescue operations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Available Donations</CardTitle>
            <Package className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.availableDonations}</div>
            <p className="text-xs text-slate-500 mt-1">Nearby active donations</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Accepted Donations</CardTitle>
            <CheckCircle className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.acceptedDonations}</div>
            <p className="text-xs text-slate-500 mt-1">In progress</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Completed Pickups</CardTitle>
            <Truck className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.completedPickups}</div>
            <p className="text-xs text-slate-500 mt-1">Total lifetime pickups</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Meals Saved</CardTitle>
            <Utensils className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.mealsSaved}</div>
            <p className="text-xs text-slate-500 mt-1">≈ {stats.foodSavedKg} kg of food</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Nearby Restaurants</CardTitle>
            <MapPin className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.nearbyRestaurants}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Today's Pickups</CardTitle>
            <Calendar className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.todaysPickups}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Requests</CardTitle>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pendingRequests}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex gap-4 pt-4">
          <Button onClick={() => navigate('/dashboard/ngo/incoming')}>
              View Available Donations
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard/ngo/volunteers')}>
              Manage Team
          </Button>
      </div>
    </div>
  );
}
