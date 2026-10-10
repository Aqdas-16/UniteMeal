const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Ensure import exists
if (!code.includes('DonorRequestsContent')) {
    code = code.replace(
        "import { DonorDashboard } from '@/pages/DonorDashboard';",
        "import { DonorDashboard } from '@/pages/DonorDashboard';\nimport { DonorRequestsContent } from '@/pages/DonorFeatures';"
    );
}

// Add route
const routeTarget = `<Route path="analytics" element={<div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full"><DonorImpactMetricsContent /></div>} />`;
if (!code.includes('path="requests"')) {
    code = code.replace(routeTarget, routeTarget + `\n                <Route path="requests" element={<div className="p-4 md:p-8 max-w-5xl mx-auto w-full"><DonorRequestsContent /></div>} />`);
}

fs.writeFileSync('src/App.tsx', code);
