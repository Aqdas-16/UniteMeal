const fs = require('fs');

const files = [
    'src/pages/DonorDashboard.tsx', 
    'src/pages/NGOHomepage.tsx', 
    'src/pages/AdminDashboard.tsx',
    'src/pages/LandingPage.tsx'
];

for (const file of files) {
    if (fs.existsSync(file)) {
        let code = fs.readFileSync(file, 'utf8');
        
        // Reduce standard gaps
        code = code.replace(/gap-8/g, "gap-6");
        code = code.replace(/gap-12/g, "gap-8");
        code = code.replace(/gap-y-12/g, "gap-y-8");
        code = code.replace(/gap-x-12/g, "gap-x-8");
        
        // Improve styling classes
        // Replace bg-slate-50 and bg-slate-900 with proper theme variables where applicable
        
        fs.writeFileSync(file, code);
    }
}
