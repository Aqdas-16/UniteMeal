const fs = require('fs');

function replaceColors(file) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    
    // Fix navigation active states
    code = code.replace(/bg-\[\#3FAE49\]\/10/g, 'bg-primary/10');
    code = code.replace(/text-\[\#3FAE49\]/g, 'text-primary');
    
    // Backgrounds
    code = code.replace(/bg-\[\#F7F8FA\]/g, 'bg-theme-bg');
    code = code.replace(/dark:bg-\[\#0F1115\]/g, 'dark:bg-theme-bg');
    code = code.replace(/bg-\[\#11131f\]/g, 'bg-theme-surface');
    code = code.replace(/bg-\[\#0F1115\]/g, 'bg-theme-bg');
    code = code.replace(/dark:bg-\[\#111113\]/g, 'dark:bg-theme-surface');

    fs.writeFileSync(file, code);
}

const files = [
    'src/components/layout/NGODashboardLayout.tsx',
    'src/components/layout/DonorDashboardLayout.tsx',
    'src/components/layout/VolunteerDashboardLayout.tsx',
    'src/components/ui/LiveTrackingMap.tsx',
    'src/components/FloatingAssistant.tsx'
];

files.forEach(replaceColors);
