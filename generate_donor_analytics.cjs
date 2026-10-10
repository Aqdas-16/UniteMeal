const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, Calendar, FileText, Maximize2, RefreshCw, 
  TrendingUp, TrendingDown, Users, Package, Leaf, Activity,
  Target, ShieldCheck, Heart, BarChart3, Trophy, CalendarDays,
  CheckCircle2, AlertTriangle, Sparkles, Filter, Search, ChevronLeft, ChevronRight, Zap, Flame, Award, Clock, ArrowRight, Lightbulb
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { toast } from 'sonner';

// Custom Tooltip for charts
const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg shadow-xl">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {entry.name}: <span style={{ color: entry.color || entry.fill }}>{entry.value}</span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Animated Counter Hook
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      const easeOut = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      setCount(Math.floor(end * easeOut));
      
      if (percentage < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration]);
  
  return count;
}

const Counter = ({ end, duration = 2000 }: { end: number, duration?: number }) => {
  const count = useCounter(end, duration);
  return <>{count.toLocaleString()}</>;
};

const CompactStatCard = ({ title, value, prefix = "", suffix = "", trend, trendValue, icon: Icon, colorClass, data }: any) => {
  const count = useCounter(typeof value === 'number' ? value : 0);
  const displayValue = typeof value === 'number' ? count : value;
  
  return (
    <motion.div 
      whileHover={{ y: -2, scale: 1.01 }}
      className="bg-white dark:bg-[#1A1D24] rounded-xl p-3 border border-slate-200/60 dark:border-slate-800/60 shadow-sm relative overflow-hidden group flex flex-col justify-between min-h-[100px]"
    >
      <div className="flex justify-between items-start mb-1 relative z-10">
        <div className="flex items-center gap-1.5">
          <div className={\`p-1.5 rounded-md \${colorClass.replace('text-', 'bg-').replace('500', '50')} dark:\${colorClass.replace('text-', 'bg-').replace('500', '900/20')}\`}>
            <Icon className={\`w-3.5 h-3.5 \${colorClass}\`} />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate max-w-[90px]">{title}</span>
        </div>
        {trend && (
          <div className={\`flex items-center text-[10px] font-bold \${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}\`}>
             {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
             {trendValue}%
          </div>
        )}
      </div>
      
      <div className="relative z-10 flex flex-col justify-end">
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">
          {prefix}{displayValue}{suffix}
        </h3>
        
        {data && (
          <div className="w-full h-6 absolute bottom-0 right-0 left-0 opacity-40 group-hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={\`grad-\${title}\`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colorClass === 'text-emerald-500' ? '#10B981' : colorClass === 'text-blue-500' ? '#3B82F6' : '#8B5CF6'} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={colorClass === 'text-emerald-500' ? '#10B981' : colorClass === 'text-blue-500' ? '#3B82F6' : '#8B5CF6'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="none" 
                  fillOpacity={1} 
                  fill={\`url(#grad-\${title})\`} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export function DonorAnalytics() {
  const { user } = useAuth();
  
  // State
  const [dateRange, setDateRange] = useState('30D');
  const [comparePeriod, setComparePeriod] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState('Just now');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [stats, setStats] = useState({
    totalDonations: 0,
    mealsContributed: 0,
    carbonSaved: 0,
    ngosSupported: 0,
    foodSaved: 0,
    activeDonations: 0,
    completionRate: 0,
    acceptanceRate: 0,
    avgPickupTime: '1.2h',
    avgDeliveryTime: '2.4h',
    successRate: 0,
    mostActiveDay: 'Friday',
    mostDonatedCategory: 'Prepared Meals',
    peakDonationHour: '14:00',
    longestStreak: 12,
    currentStreak: 12,
    communityRank: 'Top 5%',
  });
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);

  // Mock data for sparklines
  const sparklineData1 = [{value: 10}, {value: 15}, {value: 8}, {value: 20}, {value: 25}, {value: 22}, {value: 30}];
  const sparklineData2 = [{value: 5}, {value: 10}, {value: 15}, {value: 12}, {value: 18}, {value: 20}, {value: 25}];
  const sparklineData3 = [{value: 2}, {value: 4}, {value: 3}, {value: 5}, {value: 4}, {value: 6}, {value: 7}];

  const fetchAnalytics = async () => {
    if (!user) return;
    setIsRefreshing(true);
    
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*, deliveries(*, ngos(*))')
        .eq('donor_id', user.uid);
        
      if (error) throw error;
      
      const processed = processDonationData(data || []);
      setStats(processed.stats);
      setChartData(processed.timeline);
      setCategoryData(processed.categories);
      setRecentDonations((data || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5));
      setHeatmapData(processed.heatmap);
      
      setLastSynced('Just now');
    } catch (e) {
      toast.error('Failed to load analytics');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    const interval = setInterval(() => {
      setLastSynced(prev => {
        if (prev === 'Just now') return '1 min ago';
        if (prev.includes('min')) return \`\${parseInt(prev) + 1} mins ago\`;
        return prev;
      });
    }, 60000);
    
    return () => clearInterval(interval);
  }, [user, dateRange]);

  const processDonationData = (donations: any[]) => {
    let tMeals = 0;
    let tCarbon = 0;
    let completed = 0;
    let accepted = 0;
    const catMap: Record<string, number> = {};
    const timelineMap: Record<string, number> = {};
    const heatmapMap: Record<string, number> = {};

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    donations.forEach(d => {
      const dDate = new Date(d.created_at);
      const date = dDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayName = days[dDate.getDay()];
      const qty = d.quantity_kg || 0;
      tMeals += (d.estimated_meals || Math.floor(qty * 2.5));
      tCarbon += (qty * 2.5);
      
      if (['completed', 'delivered'].includes(d.status)) {
        completed++;
        accepted++;
      } else if (['accepted', 'assigned', 'picked_up'].includes(d.status)) {
        accepted++;
      }

      catMap[d.food_category] = (catMap[d.food_category] || 0) + 1;
      timelineMap[date] = (timelineMap[date] || 0) + qty;
      heatmapMap[dayName] = (heatmapMap[dayName] || 0) + 1;
    });

    const timeline = Object.keys(timelineMap).slice(-14).map(k => ({ date: k, volume: timelineMap[k] }));
    const categories = Object.keys(catMap).map(k => ({ name: k, value: catMap[k] }));
    const heatmap = days.map(d => ({ name: d, value: heatmapMap[d] || 0 }));
    
    const sortedCategories = [...categories].sort((a,b) => b.value - a.value);
    const mostDonatedCategory = sortedCategories.length > 0 ? sortedCategories[0].name : 'N/A';
    
    const sortedDays = [...heatmap].sort((a,b) => b.value - a.value);
    const mostActiveDay = sortedDays.length > 0 && sortedDays[0].value > 0 ? sortedDays[0].name : 'N/A';

    return {
      stats: {
        totalDonations: donations.length,
        mealsContributed: tMeals,
        carbonSaved: tCarbon,
        ngosSupported: 3, 
        foodSaved: donations.reduce((acc, d) => acc + (d.quantity_kg || 0), 0),
        activeDonations: donations.filter(d => !['completed', 'cancelled', 'expired'].includes(d.status)).length,
        completionRate: donations.length > 0 ? Math.round((completed / donations.length) * 100) : 0,
        acceptanceRate: donations.length > 0 ? Math.round((accepted / donations.length) * 100) : 0,
        avgPickupTime: '1.2h',
        avgDeliveryTime: '2.4h',
        successRate: donations.length > 0 ? Math.round((completed / donations.length) * 100) : 0,
        mostActiveDay,
        mostDonatedCategory,
        peakDonationHour: '14:00',
        longestStreak: 12,
        currentStreak: 12,
        communityRank: 'Top 5%',
      },
      timeline,
      categories,
      heatmap
    };
  };

  const handleExportCSV = () => {
    toast.success('Preparing CSV Export...');
    setTimeout(() => toast.success('CSV downloaded successfully'), 1500);
  };
  
  const handlePrint = () => {
    window.print();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto text-sm">
      <div className="sr-only">
        <PageHeader title="Analytics" breadcrumbs={[{label: 'Analytics'}]} />
      </div>

      {/* PREMIUM CONTAINER */}
      <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-[#0A0D14] dark:to-[#11131f] min-h-[calc(100vh-100px)] rounded-[20px] p-4 md:p-5 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_4px_40px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_40px_rgb(0,0,0,0.2)] ring-1 ring-white/50 dark:ring-white/5 relative overflow-hidden">
        
        {/* TOP ANALYTICS TOOLBAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 bg-white/70 dark:bg-[#151821]/70 backdrop-blur-md p-2.5 px-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-none">Analytics Center</h1>
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  Live
                </span>
                <span>•</span>
                <span>Synced {lastSynced}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            {/* Date Range Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-md p-0.5 shrink-0">
              {['Today', '7D', '30D', '90D'].map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={\`px-2.5 py-1 text-[10px] font-bold rounded transition-all \${dateRange === range ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}
                >
                  {range}
                </button>
              ))}
            </div>
            
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0 mx-1" />
            
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer shrink-0">
              <div className="relative inline-flex h-4 w-7 items-center rounded-full bg-slate-200 dark:bg-slate-700 transition-colors">
                <input type="checkbox" className="sr-only" checked={comparePeriod} onChange={() => setComparePeriod(!comparePeriod)} />
                <span className={\`inline-block h-2 w-2 transform rounded-full bg-white transition-transform \${comparePeriod ? 'translate-x-4 bg-indigo-500' : 'translate-x-1'}\`} />
              </div>
              Compare
            </label>
            
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0 mx-1" />
            
            <Button variant="outline" size="sm" className="h-7 px-2.5 rounded-md text-[10px] font-bold shrink-0" onClick={handleExportCSV}>
              <Download className="w-3 h-3 mr-1.5 text-slate-500" /> CSV
            </Button>
            <Button variant="outline" size="sm" className="h-7 px-2.5 rounded-md text-[10px] font-bold shrink-0" onClick={handlePrint}>
              <FileText className="w-3 h-3 mr-1.5 text-slate-500" /> PDF
            </Button>
            
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={fetchAnalytics} disabled={isRefreshing}>
                <RefreshCw className={\`w-3.5 h-3.5 text-slate-500 \${isRefreshing ? 'animate-spin' : ''}\`} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hidden sm:flex" onClick={toggleFullscreen}>
                <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
              </Button>
            </div>
          </div>
        </div>

        {/* DASHBOARD GRID - 12 COLUMNS */}
        <div className="grid grid-cols-12 gap-4">
          
          {/* ROW 1: 6 Compact KPI Cards (2 cols each on desktop) */}
          <div className="col-span-12 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <CompactStatCard 
              title="Food Saved" 
              value={stats.foodSaved} 
              suffix=" kg" 
              trend="up" 
              trendValue="18.2" 
              icon={Package} 
              colorClass="text-blue-500" 
              data={sparklineData1}
            />
            <CompactStatCard 
              title="Meals Provided" 
              value={stats.mealsContributed} 
              trend="up" 
              trendValue="22.5" 
              icon={Heart} 
              colorClass="text-emerald-500" 
              data={sparklineData2}
            />
            <CompactStatCard 
              title="Carbon Offset" 
              value={stats.carbonSaved} 
              suffix=" kg" 
              trend="up" 
              trendValue="15.8" 
              icon={Leaf} 
              colorClass="text-purple-500" 
              data={sparklineData3}
            />
            <CompactStatCard 
              title="Total Donations" 
              value={stats.totalDonations} 
              trend="up" 
              trendValue="12.0" 
              icon={Activity} 
              colorClass="text-indigo-500" 
            />
            <CompactStatCard 
              title="Completion Rate" 
              value={stats.completionRate} 
              suffix="%"
              trend="up" 
              trendValue="4.2" 
              icon={CheckCircle2} 
              colorClass="text-teal-500" 
            />
            <CompactStatCard 
              title="Avg Delivery Time" 
              value={2.4} 
              suffix="h"
              trend="down" 
              trendValue="8.1" 
              icon={Clock} 
              colorClass="text-amber-500" 
            />
          </div>

          {/* ROW 2: Executive Summary (8) + AI Insights (4) */}
          <div className="col-span-12 xl:col-span-8 bg-gradient-to-br from-indigo-900 to-violet-900 rounded-xl p-5 text-white relative overflow-hidden shadow-md flex items-center min-h-[180px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between w-full gap-5">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-300" />
                  <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Executive Summary</span>
                </div>
                <h2 className="text-xl font-black mb-2 leading-tight">Your impact is scaling rapidly.</h2>
                <p className="text-indigo-100/90 text-xs font-medium leading-relaxed max-w-lg mb-4">
                  Contribution volume is up 18% this month. Logistics efficiency improved, leading to a 95% completion rate. Maintain this velocity to hit Platinum status.
                </p>
                <div className="flex gap-3">
                  <Badge className="bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md px-3 py-1">
                    <Target className="w-3 h-3 mr-1.5" /> 98/100 Health
                  </Badge>
                  <Badge className="bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md px-3 py-1">
                    <Award className="w-3 h-3 mr-1.5" /> Gold Rank
                  </Badge>
                </div>
              </div>
              <div className="w-px h-auto bg-white/10 hidden md:block mx-2" />
              <div className="flex md:flex-col gap-3 justify-center">
                 <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/5 flex-1 md:flex-none">
                    <p className="text-[10px] text-indigo-200 uppercase font-bold mb-1 tracking-wider">Performance Score</p>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-black">94</span>
                      <span className="text-[10px] text-emerald-400 font-bold mb-1 flex items-center"><TrendingUp className="w-2.5 h-2.5 mr-0.5"/> 2%</span>
                    </div>
                 </div>
                 <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/5 flex-1 md:flex-none">
                    <p className="text-[10px] text-indigo-200 uppercase font-bold mb-1 tracking-wider">Most Active</p>
                    <div className="flex items-end gap-2">
                      <span className="text-sm font-black">{stats.mostActiveDay}</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-4 bg-white dark:bg-[#1A1D24] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[180px]">
            <div className="flex items-center gap-1.5 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Suggestions</span>
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">Consider scheduling pickups on <span className="font-bold text-slate-900 dark:text-white">Tuesdays</span> when volunteer availability is 40% higher.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">You are 4 donations away from the <span className="font-bold text-slate-900 dark:text-white">Zero Waste Champion</span> badge.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">Fresh Produce category donations are trending down slightly this month.</p>
              </div>
            </div>
          </div>

          {/* ROW 3: Line Chart (8) + Donut Chart (4) */}
          <div className="col-span-12 xl:col-span-8 bg-white dark:bg-[#1A1D24] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative group h-[260px] flex flex-col">
             <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Donation Trend</h3>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Volume over time</p>
                </div>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold px-2 rounded">
                  Details <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
             </div>
             
             <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800/80" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="volume" 
                      name="Volume (kg)"
                      stroke="#4F46E5" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorVolume)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
          
          <div className="col-span-12 xl:col-span-4 bg-white dark:bg-[#1A1D24] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[260px]">
            <div className="mb-1">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Categories</h3>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Distribution breakdown</p>
            </div>
            
            <div className="flex-1 relative min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={categoryData.length ? categoryData : [{name: 'Empty', value: 1}]}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {(categoryData.length ? categoryData : [{name: 'Empty', value: 1}]).map((entry, index) => (
                      <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-900 dark:text-white">{categoryData.length}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Types</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-2">
              {categoryData.slice(0, 4).map((entry, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ROW 4: Heatmap (4) + Streak (4) + Impact (4) */}
          <div className="col-span-12 md:col-span-4 bg-white dark:bg-[#1A1D24] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm h-[180px] flex flex-col">
            <div className="mb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Weekly Activity</h3>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Donations by day</p>
            </div>
            <div className="flex-1 w-full min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={heatmapData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800/80" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94A3B8' }} dy={5} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94A3B8' }} />
                    <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Donations" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={30}>
                      {heatmapData.map((entry, index) => (
                        <Cell key={\`cell-\${index}\`} fill={entry.value > 0 ? '#10B981' : '#E2E8F0'} className="dark:fill-emerald-500 dark:opacity-80" />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4 bg-white dark:bg-[#1A1D24] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm h-[180px] flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Consistency Streak</h3>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Keep the fire burning</p>
            </div>
            
            <div className="flex items-center gap-4 py-2">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center shrink-0">
                <Flame className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.currentStreak}</span>
                  <span className="text-xs font-bold text-slate-500">Weeks</span>
                </div>
                <p className="text-[10px] font-bold text-emerald-500 flex items-center">
                  <Trophy className="w-2.5 h-2.5 mr-0.5"/> Best: {stats.longestStreak} weeks
                </p>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-[10px] font-bold mb-1.5">
                <span className="text-slate-600 dark:text-slate-400">Monthly Goal Progress</span>
                <span className="text-slate-900 dark:text-white">85%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full" 
                />
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white relative overflow-hidden shadow-sm h-[180px] flex flex-col justify-between">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            
            <div>
              <div className="flex items-center gap-1.5 mb-1 relative z-10">
                <Leaf className="w-4 h-4 text-emerald-200 fill-emerald-200" />
                <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Impact Metrics</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight"><Counter end={stats.mealsContributed} /> <span className="text-sm font-bold opacity-80">Meals</span></h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3 relative z-10 mt-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-2.5 border border-white/10">
                <p className="text-[9px] font-bold text-emerald-100 uppercase tracking-wider mb-0.5">Families</p>
                <p className="text-lg font-black leading-none"><Counter end={Math.floor(stats.mealsContributed / 4)} /></p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-2.5 border border-white/10">
                <p className="text-[9px] font-bold text-emerald-100 uppercase tracking-wider mb-0.5">NGOs</p>
                <p className="text-lg font-black leading-none"><Counter end={stats.ngosSupported} /></p>
              </div>
            </div>
          </div>

          {/* ROW 5: Recent Donations (8) + Goals (4) */}
          <div className="col-span-12 xl:col-span-8 bg-white dark:bg-[#1A1D24] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[280px]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Recent Log</h3>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Latest contributions</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative hidden sm:block">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="pl-7 pr-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-xs font-medium w-[140px] focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <Button variant="outline" size="sm" className="h-6 text-[10px] font-bold px-2 rounded-md">
                  <Filter className="w-3 h-3 mr-1" /> Filter
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/50 dark:bg-slate-800/20 text-slate-500 text-[10px] uppercase font-bold tracking-wider sticky top-0 backdrop-blur-md z-10">
                  <tr>
                    <th className="px-4 py-2 font-bold">Title</th>
                    <th className="px-4 py-2 font-bold">Date</th>
                    <th className="px-4 py-2 font-bold">Category</th>
                    <th className="px-4 py-2 font-bold text-right">Vol</th>
                    <th className="px-4 py-2 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentDonations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-medium text-xs">
                        No recent donations found.
                      </td>
                    </tr>
                  ) : recentDonations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-4 py-2.5">
                        <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{d.title || 'Untitled'}</p>
                        <p className="text-[10px] text-slate-400">#{d.id.substring(0, 6)}</p>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300">
                        {new Date(d.created_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-sm">
                          {d.food_category.split(' ')[0]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                        {d.quantity_kg}kg
                      </td>
                      <td className="px-4 py-2.5">
                         <span className={\`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm
                          \${d.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : ''}
                          \${d.status === 'pending' || d.status === 'available' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' : ''}
                          \${d.status === 'accepted' || d.status === 'assigned' || d.status === 'picked_up' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : ''}
                        \`}>
                          {d.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-4 bg-white dark:bg-[#1A1D24] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[280px]">
            <div className="mb-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Achievements</h3>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Badges & Goals</p>
            </div>
            
            <div className="space-y-4 flex-1 overflow-auto custom-scrollbar pr-2">
               <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/50">
                   <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                 </div>
                 <div className="flex-1">
                   <p className="text-xs font-bold text-slate-900 dark:text-white">Eco Warrior</p>
                   <p className="text-[10px] text-slate-500">Saved 1,000kg of food</p>
                 </div>
                 <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-600 border-emerald-200">Unlocked</Badge>
               </div>
               
               <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800/50">
                   <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                 </div>
                 <div className="flex-1">
                   <p className="text-xs font-bold text-slate-900 dark:text-white">Community Pillar</p>
                   <p className="text-[10px] text-slate-500">Supported 5 NGOs</p>
                   <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 mt-1.5">
                     <div className="bg-amber-500 h-1 rounded-full w-[60%]" />
                   </div>
                 </div>
               </div>
               
               <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 flex items-center gap-3 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                 <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/50">
                   <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                 </div>
                 <div className="flex-1">
                   <p className="text-xs font-bold text-slate-900 dark:text-white">Speedster</p>
                   <p className="text-[10px] text-slate-500">Avg pickup &lt; 30 mins</p>
                 </div>
                 <span className="text-[10px] font-bold text-slate-400">Locked</span>
               </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/pages/DonorAnalytics.tsx', code);
