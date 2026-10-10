const fs = require('fs');

const code = `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { TrendingUp, Utensils, Heart, Truck, Users, Clock, CheckCircle } from 'lucide-react';

export function NGOAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    foodReceived: 0,
    mealsServed: 0,
    carbonSaved: 0,
    deliveriesCompleted: 0,
    partnerRestaurants: 0,
    familiesServed: 0,
    averagePickupTime: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      // 1. Completed Pickups
      const { data: tasks } = await supabase.from('pickup_tasks')
         .select('*, donations(quantity_kg, quantity, estimated_meals, created_at, restaurant_id)')
         .eq('ngo_id', user.uid);
         
      if (tasks) {
         let food = 0;
         let meals = 0;
         let completed = 0;
         let totalPickupTimeMinutes = 0;
         let pickupsWithTimes = 0;
         const donors = new Set();
         const grouped: any = {};
         
         tasks.forEach((d: any) => {
            if (d.donations?.restaurant_id) donors.add(d.donations.restaurant_id);
            if (d.restaurant_id) donors.add(d.restaurant_id);
            
            if (d.status === 'completed' || d.status === 'delivered' || d.status === 'picked_up') {
               completed++;
               const qty = Number(d.donations?.quantity_kg || d.donations?.quantity || 0);
               food += qty;
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
         
         setStats({ 
             foodReceived: parseFloat(food.toFixed(1)), 
             mealsServed: meals, 
             carbonSaved: parseFloat((food * 2.5).toFixed(1)), // approx 2.5kg CO2 per kg of food
             deliveriesCompleted: completed, 
             partnerRestaurants: donors.size,
             familiesServed: Math.round(meals / 4), // approx 4 meals per family
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pickup_tasks', filter: \`ngo_id=eq.\${user.uid}\` }, fetchStats)
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
         <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Impact Analytics</h1>
         <p className="text-sm text-slate-500 mt-1">Measure your organization's social and environmental impact.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Meals Served', value: stats.mealsServed, icon: <Utensils className="w-4 h-4 text-orange-500" /> },
          { label: 'Food Rescued', value: \`\${stats.foodReceived} kg\`, icon: <Heart className="w-4 h-4 text-emerald-500" /> },
          { label: 'Families Helped', value: stats.familiesServed, icon: <Users className="w-4 h-4 text-blue-500" /> },
          { label: 'Carbon Saved', value: \`\${stats.carbonSaved} kg CO₂\`, icon: <TrendingUp className="w-4 h-4 text-teal-500" /> },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
              <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
                 <Truck className="w-8 h-8 text-indigo-500 mb-2" />
                 <p className="text-3xl font-bold">{stats.deliveriesCompleted}</p>
                 <p className="text-sm text-slate-500 mt-1">Deliveries Completed</p>
              </CardContent>
          </Card>
          <Card>
              <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
                 <Users className="w-8 h-8 text-amber-500 mb-2" />
                 <p className="text-3xl font-bold">{stats.partnerRestaurants}</p>
                 <p className="text-sm text-slate-500 mt-1">Partner Restaurants</p>
              </CardContent>
          </Card>
          <Card>
              <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
                 <Clock className="w-8 h-8 text-rose-500 mb-2" />
                 <p className="text-3xl font-bold">{stats.averagePickupTime > 0 ? \`\${stats.averagePickupTime} min\` : 'N/A'}</p>
                 <p className="text-sm text-slate-500 mt-1">Avg. Pickup Time</p>
              </CardContent>
          </Card>
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
`;
fs.writeFileSync('src/pages/NGOAnalytics.tsx', code);
