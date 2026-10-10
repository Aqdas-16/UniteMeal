import fs from 'fs';

let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf-8');

content = content.replace(/text-slate-600 dark:text-slate-400/g, 'text-theme-text-secondary');
content = content.replace(/text-slate-300 dark:text-slate-600/g, 'text-theme-border');
content = content.replace(/text-slate-900/g, 'text-theme-text');
content = content.replace(/text-slate-500/g, 'text-theme-text-secondary');
content = content.replace(/dark:bg-\[#171F2B\]/g, 'dark:bg-theme-surface');

// Also do bg colors
content = content.replace(/bg-white hover:bg-slate-50 text-slate-900/g, 'bg-theme-surface text-theme-text');
content = content.replace(/bg-white hover:bg-slate-50 border border-slate-200 text-theme-text font-semibold shadow-sm transition-transform hover:-translate-y-0.5 rounded-xl/g, 'bg-theme-surface border border-theme-border text-theme-text font-semibold shadow-sm transition-transform hover:-translate-y-0.5 rounded-xl');

content = content.replace(/text-\[#111827\]/g, 'text-theme-text');
content = content.replace(/text-\[#F8FAFC\]/g, 'text-theme-text');
content = content.replace(/text-\[#6B7280\]/g, 'text-theme-text-secondary');
content = content.replace(/text-\[#AEB7C3\]/g, 'text-theme-text-secondary');

fs.writeFileSync('src/pages/LandingPage.tsx', content);

console.log("Done");
