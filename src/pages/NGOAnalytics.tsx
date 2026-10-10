import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { TrendingUp, Utensils, Heart, Truck, Users, Clock, CheckCircle } from 'lucide-react';

import { CertificateCard } from '@/src/components/dashboard/CertificateCard';

export function NGOAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    availableDonations: 0,
    acceptedPickups: 0,
    completedDeliveries: 0,
    mealsRescued: 0,
    partnerRestaurants: 0,
    activeVolunteers: 0,
    averagePickupTime: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      // 1. Completed Pickups
      const { data: tasks } = await supabase.from('deliveries')
         .select('*, donations(quantity_kg, quantity, estimated_meals, created_at, donor_id)')
         .eq('ngo_id', user.uid);
         
      if (tasks) {
         let meals = 0;
         let completed = 0;
         let accepted = 0;
         let totalPickupTimeMinutes = 0;
         let pickupsWithTimes = 0;
         const donors = new Set();
         const grouped: any = {};
         
         tasks.forEach((d: any) => {
            if (d.donations?.donor_id) donors.add(d.donations.restaurant_id);
            if (d.donations?.donor_id) donors.add(d.donations?.donor_id);
            
            if (d.status !== 'cancelled') {
               accepted++;
            }
            
            if (d.status === 'completed' || d.status === 'delivered' || d.status === 'picked_up') {
               completed++;
               const qty = Number(d.donations?.quantity_kg || d.donations?.quantity || 0);
               meals += Number(d.donations?.estimated_meals || (qty * 4));
               
               if (d.donations?.created_at && d.picked_up_at) {
                   const created = new Date(d.donations.created_at).getTime();
                   const picked = new Date(d.picked_up_at).getTime();
                   const diffMins = (picked - created) / (1000 * 60);
                   if (diffMins > 0) {
                      totalPickupTimeMinutes += diffMins;
                      pickupsWithTimes++;
                   }
               }
               
               if (d.completed_at || d.updated_at) {
                   const dateObj = new Date(d.completed_at || d.updated_at);
                   const date = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                   grouped[date] = (grouped[date] || 0) + qty;
               }
            }
         });
         
         const avgPickup = pickupsWithTimes > 0 ? Math.round(totalPickupTimeMinutes / pickupsWithTimes) : 0;
         
         // Fetch other data
         const { count: volunteersCount } = await supabase.from('ngo_volunteers').select('*', { count: 'exact', head: true }).eq('ngo_id', user.uid);
         const { count: availableCount } = await supabase.from('donations').select('*', { count: 'exact', head: true }).eq('status', 'available');
         
         setStats({
             availableDonations: availableCount || 0,
             acceptedPickups: accepted,
             completedDeliveries: completed,
             mealsRescued: meals,
             partnerRestaurants: donors.size,
             activeVolunteers: volunteersCount || 0,
             averagePickupTime: avgPickup
         });
         
         // Last 7 days
         const trend = [];
         for (let i = 6; i >= 0; i--) {
             const d = new Date();
             d.setDate(d.getDate() - i);
             const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
             trend.push({ name: dateStr, amount: grouped[dateStr] || 0 });
         }
         
         setChartData(trend);
      }
    };
    
    fetchStats();
    
    const channel = supabase.channel('ngo-analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries', filter: `ngo_id=eq.${user.uid}` }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ngo_volunteers', filter: `ngo_id=eq.${user.uid}` }, fetchStats)
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <div className="space-y-6">
      <CertificateCard role="ngo" />
      <div>
         <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Impact Analytics</h1>
         <p className="text-sm text-slate-500 mt-1">Measure your organization's social and environmental impact.</p>
      </div>

      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Available Donations', value: stats.availableDonations, icon: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
          { label: 'Accepted Pickups', value: stats.acceptedPickups, icon: <Truck className="w-4 h-4 text-indigo-500" /> },
          { label: 'Completed Deliveries', value: stats.completedDeliveries, icon: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
          { label: 'Meals Rescued', value: stats.mealsRescued, icon: <Utensils className="w-4 h-4 text-orange-500" /> },
          { label: 'Partner Restaurants', value: stats.partnerRestaurants, icon: <Users className="w-4 h-4 text-amber-500" /> },
          { label: 'Active Volunteers', value: stats.activeVolunteers, icon: <Users className="w-4 h-4 text-blue-500" /> },
          { label: 'Average Pickup Time', value: stats.averagePickupTime > 0 ? `${stats.averagePickupTime} min` : 'N/A', icon: <Clock className="w-4 h-4 text-rose-500" /> },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="h-full">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-full">
                    {stat.icon}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>


      <div className="grid grid-cols-1 gap-6">
          <Card>
              <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-semibold">Weekly Food Rescue Volume (kg)</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="h-[300px]">
                  {chartData.some(d => d.amount > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.4} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#64748b'}} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#64748b'}} />
                        <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                        <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-500 border border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/50 text-sm">
                      No data available yet
                    </div>
                  )}
                </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
