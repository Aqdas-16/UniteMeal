const fs = require('fs');
let code = fs.readFileSync('src/pages/DonorAnalytics.tsx', 'utf8');

// Add more recharts components
code = code.replace(
  "XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar",
  "XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Legend"
);

// We need to inject the Compare toggle into the top toolbar.
const toolbarSearch = `<div className="w-px h-6 bg-slate-200 dark:bg-slate-700 shrink-0" />`;
const toolbarReplace = `<div className="w-px h-6 bg-slate-200 dark:bg-slate-700 shrink-0" />
            
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer shrink-0">
              <div className="relative inline-flex h-5 w-9 items-center rounded-full bg-slate-200 dark:bg-slate-700 transition-colors">
                <input type="checkbox" className="sr-only" checked={comparePeriod} onChange={() => setComparePeriod(!comparePeriod)} />
                <span className={\`inline-block h-3 w-3 transform rounded-full bg-white transition-transform \${comparePeriod ? 'translate-x-5 bg-indigo-500' : 'translate-x-1'}\`} />
              </div>
              Compare
            </label>
            
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 shrink-0" />`;
code = code.replace(toolbarSearch, toolbarReplace);

// I will insert the "FEEDING IMPACT CARD" right below the Executive Summary.
const impactCardStr = `
        {/* FEEDING IMPACT CARD */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-lg shadow-emerald-900/20">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-teal-900/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-6 h-6 text-emerald-200 fill-emerald-200" />
                <span className="text-sm font-bold text-emerald-100 uppercase tracking-widest">Global Feeding Impact</span>
              </div>
              <div className="flex items-end gap-3 mb-2">
                <h2 className="text-5xl lg:text-7xl font-black tracking-tighter">
                  {<Counter end={stats.mealsContributed} />}
                </h2>
                <span className="text-xl lg:text-2xl font-bold text-emerald-100 mb-2">Meals</span>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Badge className="bg-white/20 text-white border-none hover:bg-white/30 backdrop-blur-md">
                  <TrendingUp className="w-3 h-3 mr-1" /> +24% Weekly Growth
                </Badge>
                <span className="text-sm font-medium text-emerald-100">Top 5% of Donors</span>
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-2 gap-4 w-full">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-start gap-3">
                <Package className="w-5 h-5 text-emerald-200 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-200 uppercase">Food Saved</p>
                  <p className="text-2xl font-black">{<Counter end={stats.foodSaved} />} <span className="text-sm font-bold opacity-75">kg</span></p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-start gap-3">
                <Leaf className="w-5 h-5 text-emerald-200 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-200 uppercase">Carbon Saved</p>
                  <p className="text-2xl font-black">{<Counter end={stats.carbonSaved} />} <span className="text-sm font-bold opacity-75">kg</span></p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-start gap-3">
                <Users className="w-5 h-5 text-emerald-200 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-200 uppercase">Families Helped</p>
                  <p className="text-2xl font-black">{<Counter end={Math.floor(stats.mealsContributed / 4)} />}</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-200 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-200 uppercase">NGOs Served</p>
                  <p className="text-2xl font-black">{<Counter end={stats.ngosSupported} />}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
`;

// Insert after Executive Summary
code = code.replace(
  "        {/* KPI CARDS GRID */}",
  impactCardStr + "\n        {/* KPI CARDS GRID */}"
);

// Add a wrapper component for useCounter to use in JSX
const counterComponent = `
const Counter = ({ end, duration = 2000 }: { end: number, duration?: number }) => {
  const count = useCounter(end, duration);
  return <>{count.toLocaleString()}</>;
};
`;
code = code.replace("const StatCard = ", counterComponent + "\nconst StatCard = ");

fs.writeFileSync('src/pages/DonorAnalytics.tsx', code);
