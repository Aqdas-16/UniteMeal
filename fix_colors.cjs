const fs = require('fs');

function replaceColors(file) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    
    // Greens
    code = code.replace(/bg-\[\#22C55E\]/g, 'bg-primary');
    code = code.replace(/hover:bg-\[\#16a34a\]/g, 'hover:bg-primary/90');
    code = code.replace(/hover:bg-\[\#16A34A\]/g, 'hover:bg-primary/90');
    code = code.replace(/text-\[\#22C55E\]/g, 'text-primary');
    code = code.replace(/bg-\[\#3FAE49\]/g, 'bg-primary');
    code = code.replace(/text-\[\#3FAE49\]/g, 'text-primary');
    code = code.replace(/group-hover:bg-\[\#22C55E\]/g, 'group-hover:bg-primary');

    // Oranges / Ambers
    code = code.replace(/bg-\[\#F97316\]/g, 'bg-secondary');
    code = code.replace(/text-\[\#F97316\]/g, 'text-secondary');
    code = code.replace(/text-\[\#F59E0B\]/g, 'text-secondary');
    
    fs.writeFileSync(file, code);
}

const files = [
    'src/pages/LandingPage.tsx',
    'src/pages/DonorDashboard.tsx',
    'src/pages/NGOHomepage.tsx',
    'src/pages/AdminDashboard.tsx',
    'src/components/layout/Navbar.tsx'
];

files.forEach(replaceColors);
