const fs = require('fs');
let code = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');

// The text-[#FFFFFF] was already text-[#FFFFFF]. Did I change it? 
// No, I only looked at the diff and didn't touch it.

// Let's replace the hardcoded colors in the rest of the page.
code = code.replace(/text-\[\#111827\]/g, "text-theme-text");
code = code.replace(/dark:text-\[\#F8FAFC\]/g, "");
code = code.replace(/text-\[\#6B7280\]/g, "text-theme-text-secondary");
code = code.replace(/dark:text-\[\#9CA3AF\]/g, "");
code = code.replace(/border-\[rgba\(15,23,42,0\.08\)\]/g, "border-theme-border");
code = code.replace(/dark:border-\[rgba\(255,255,255,0\.08\)\]/g, "");
code = code.replace(/dark:border-\[rgba\(255,255,255,0\.06\)\]/g, "");
code = code.replace(/bg-\[\#FAFAF8\]/g, "bg-theme-surface-2");
code = code.replace(/dark:bg-\[\#0B0F14\]/g, "");
code = code.replace(/bg-\[\#FAFBFC\]/g, "bg-theme-bg");
code = code.replace(/dark:bg-\[\#090D12\]/g, "");

// Reduce spacing in grids
code = code.replace(/gap-y-\[28px\]/g, "gap-y-6");
code = code.replace(/gap-x-12/g, "gap-x-8");

fs.writeFileSync('src/pages/LandingPage.tsx', code);
