import fs from 'fs';

let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf-8');

// Replace standard colors with theme variables
content = content.replace(/text-slate-900 dark:text-white/g, 'text-theme-text');
content = content.replace(/text-slate-500 dark:text-slate-400/g, 'text-theme-text-secondary');
content = content.replace(/text-slate-500 dark:text-\[#9CA3AF\]/g, 'text-theme-text-secondary');
content = content.replace(/text-slate-600 dark:text-slate-300/g, 'text-theme-text-secondary');
content = content.replace(/text-slate-900/g, 'text-theme-text');
content = content.replace(/text-slate-500/g, 'text-theme-text-secondary');

// Background substitutions
// Hero Overlay
content = content.replace(/bg-black\/30 dark:bg-black\/50/g, 'bg-black/32 dark:bg-black/58');

// How it Works lines
content = content.replace(/bg-slate-200 dark:bg-slate-800/g, 'bg-theme-border');

// Buttons
// "Become a Partner" Button
content = content.replace(/bg-white hover:bg-slate-50 dark:bg-\[#1C2533\] dark:text-white dark:border dark:border-white\/\[0\.05\] dark:hover:bg-\[#222D3D\]/g, 
  'bg-white text-[#111827] dark:bg-[#202734] dark:border dark:border-white/[0.08] dark:text-[#F8FAFC]');
content = content.replace(/bg-white hover:bg-slate-50 border border-slate-200 text-theme-text font-semibold shadow-sm transition-transform hover:-translate-y-0.5 rounded-xl/g, 
  'bg-white text-[#111827] dark:bg-[#202734] dark:border dark:border-white/[0.08] dark:text-[#F8FAFC] font-semibold shadow-sm transition-transform hover:-translate-y-0.5 rounded-xl border border-theme-border');


// Cards / Surface
content = content.replace(/bg-white\/40 dark:bg-\[#1C2533\]/g, 'bg-theme-surface');
content = content.replace(/bg-white\/\[0\.7(2|)\] dark:bg-\[#171F2B\] dark:hover:bg-\[#1D2735\]/g, 'bg-theme-surface');
content = content.replace(/bg-white dark:bg-\[#1E2530\]/g, 'bg-theme-surface');
content = content.replace(/bg-slate-100\/50 dark:bg-slate-800\/20/g, 'bg-theme-surface-2');


// Borders
content = content.replace(/border-white\/40 dark:border-white\/\[0\.04\]/g, 'border-theme-border');
content = content.replace(/border-white\/\[0\.45\] dark:border-white\/\[0\.05\]/g, 'border-theme-border');
content = content.replace(/border-white\/\[0\.6\] dark:border-white\/\[0\.05\]/g, 'border-theme-border');
content = content.replace(/border-slate-100 dark:border-white\/\[0\.0(4|5)\]/g, 'border-theme-border');
content = content.replace(/border border-slate-200\/50 dark:border-white\/5/g, 'border border-theme-border');


// FAQ Accordions
content = content.replace(/bg-white dark:bg-\[#1C2533\]/g, 'bg-theme-surface');
content = content.replace(/dark:hover:bg-\[#222D3D\]/g, 'dark:hover:bg-theme-surface-2');
content = content.replace(/border-slate-200\/60 dark:border-white\/\[0\.05\]/g, 'border-theme-border');


fs.writeFileSync('src/pages/LandingPage.tsx', content);

let cssContent = fs.readFileSync('src/index.css', 'utf-8');
cssContent = cssContent.replace(/\.dark body \{\n  background-color: #0B0F14 !important;\n\}\n/g, '');
cssContent = cssContent.replace(/\.dark \.premium-card \{[\s\S]*?box-shadow:.*?\n  \}/g, '.dark .premium-card {\n    background: var(--surface);\n    border: 1px solid var(--border);\n    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);\n  }');
cssContent = cssContent.replace(/\.premium-card \{[\s\S]*?box-shadow:.*?\n  \}/g, '.premium-card {\n    background: var(--surface);\n    backdrop-filter: blur(12px);\n    -webkit-backdrop-filter: blur(12px);\n    border: 1px solid var(--border);\n    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);\n  }');
fs.writeFileSync('src/index.css', cssContent);

let footerContent = fs.readFileSync('src/components/layout/Footer.tsx', 'utf-8');
// remove hardcoded text and bg
footerContent = footerContent.replace(/bg-white dark:bg-\[#171F2B\]/g, 'bg-theme-surface');
footerContent = footerContent.replace(/border-slate-200\/60 dark:border-white\/\[0\.04\]/g, 'border-theme-border');
footerContent = footerContent.replace(/text-slate-900 dark:text-white/g, 'text-theme-text');
footerContent = footerContent.replace(/text-slate-500 dark:text-\[#AAB2BF\]/g, 'text-theme-text-secondary');
footerContent = footerContent.replace(/text-slate-400 dark:text-\[#88909E\]/g, 'text-theme-text-secondary');
footerContent = footerContent.replace(/bg-slate-50 dark:bg-\[#1C2533\]/g, 'bg-theme-bg dark:bg-theme-surface');
footerContent = footerContent.replace(/hover:text-slate-900 dark:hover:text-white/g, 'hover:text-[#3FAE49] dark:hover:text-[#3FAE49]');
footerContent = footerContent.replace(/hover:bg-slate-100 dark:hover:bg-\[#222D3D\]/g, 'hover:bg-theme-surface-2');
footerContent = footerContent.replace(/bg-black\/\[0\.04\] dark:bg-white\/\[0\.06\]/g, 'bg-theme-border');

// footer specific text
footerContent = footerContent.replace(/text-\[#111827\]/g, 'text-theme-text');

fs.writeFileSync('src/components/layout/Footer.tsx', footerContent);

console.log("Done");
