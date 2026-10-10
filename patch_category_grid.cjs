const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CreateDonation.tsx', 'utf8');

code = code.replace(
  '<div className="grid grid-cols-3 gap-2">',
  '<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">'
);

code = code.replace(
  /h-\[68px\] rounded-lg border flex flex-col items-center justify-center gap-1 transition-colors \$\{formData\.category === cat\.id \? 'border-emerald-500 bg-emerald-50\/50 dark:bg-emerald-900\/10 text-emerald-700 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500\/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-\[#111113\] text-slate-600 dark:text-slate-400 bg-white dark:bg-\[#0a0a0a\]'}/g,
  `h-[70px] rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all max-w-[150px] mx-auto w-full \${formData.category === cat.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/30' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#111113] text-slate-600 dark:text-slate-400 bg-white dark:bg-[#0a0a0a]'}`
);

fs.writeFileSync('src/components/dashboard/CreateDonation.tsx', code);
