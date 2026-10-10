import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { Activity, TrendingUp, PieChart as PieChartIcon, BarChart3, Database } from 'lucide-react';

// Professional SaaS Color Palette
const COLORS = {
  primary: '#10b981',   // Emerald (Volume)
  secondary: '#6366f1', // Indigo (Status)
  tertiary: '#f59e0b',  // Amber (Meals)
  slate: '#64748b',
  gridLight: '#f1f5f9',
  gridDark: '#1e293b'
};

const PIE_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

const tooltipStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.98)',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
  fontSize: '12px',
  fontWeight: 600,
  color: '#0f172a',
  padding: '8px 12px'
};

export function DonorPerformanceCharts({ donationStats, monthlyData }: { donationStats: any[], monthlyData: any[] }) {
  
  if (!monthlyData || monthlyData.length === 0) {
    return (
      <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A0A0A]">
         <CardContent className="flex flex-col items-center justify-center text-center h-[300px]">
             <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
                <Database className="w-5 h-5 text-slate-400" />
             </div>
             <p className="text-[13px] font-bold text-slate-900 dark:text-white">Insufficient Data</p>
             <p className="text-[12px] text-slate-500 mt-1 max-w-[250px] leading-relaxed">
               Analytics dashboards will automatically generate once your first few donations are completed.
             </p>
         </CardContent>
      </Card>
    );
  }

  const pieData = donationStats.length > 0 ? donationStats : [{ status: 'No Data', count: 1 }];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
      
      {/* 1. Area Chart - Volume Trend */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A0A0A] shadow-sm overflow-hidden">
        <CardHeader className="p-5 pb-0 border-none">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> 
                Volume Trend
              </h3>
              <p className="text-[11px] font-medium text-slate-500 mt-1">Total food rescued (KG) per month</p>
            </div>
            <div className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              YTD Growth
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-6 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.gridLight} className="dark:opacity-10" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: COLORS.slate, fontWeight: 500 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: COLORS.slate, fontWeight: 500 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: COLORS.primary, strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area 
                type="monotone" 
                dataKey="total_kg" 
                name="Volume (KG)"
                stroke={COLORS.primary} 
                fill="url(#colorVolume)" 
                strokeWidth={2.5} 
                activeDot={{ r: 5, strokeWidth: 0, fill: COLORS.primary }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 2. Bar Chart - Pipeline Status */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A0A0A] shadow-sm overflow-hidden">
        <CardHeader className="p-5 pb-0 border-none">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" /> 
                Pipeline Distribution
              </h3>
              <p className="text-[11px] font-medium text-slate-500 mt-1">Donation count by current status</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-6 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={donationStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.gridLight} className="dark:opacity-10" />
              <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: COLORS.slate, fontWeight: 500 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: COLORS.slate, fontWeight: 500 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: COLORS.gridLight, opacity: 0.4 }} className="dark:opacity-10" />
              <Bar dataKey="count" name="Donations" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 3. Donut Chart - Category Spread */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A0A0A] shadow-sm overflow-hidden">
        <CardHeader className="p-5 pb-0 border-none">
          <div>
            <h3 className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-emerald-600" /> 
              Category Breakdown
            </h3>
            <p className="text-[11px] font-medium text-slate-500 mt-1">Distribution of food types</p>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-[260px] flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={4}
                dataKey="count"
                nameKey="status"
                stroke="none"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend 
                verticalAlign="bottom" 
                height={40} 
                iconType="circle" 
                wrapperStyle={{ fontSize: '11px', fontWeight: 500, color: COLORS.slate }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 4. Smooth Line - Impact Metrics */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A0A0A] shadow-sm overflow-hidden">
        <CardHeader className="p-5 pb-0 border-none">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500" /> 
                Impact Delivery
              </h3>
              <p className="text-[11px] font-medium text-slate-500 mt-1">Estimated meals served over time</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-6 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.gridLight} className="dark:opacity-10" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: COLORS.slate, fontWeight: 500 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: COLORS.slate, fontWeight: 500 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: COLORS.tertiary, strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Line 
                type="monotone" 
                dataKey="total_kg" // Ensure this binds to your calculated meals logic in real implementation
                name="Meals Served"
                stroke={COLORS.tertiary} 
                strokeWidth={2.5} 
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: COLORS.tertiary }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </div>
  );
}