const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('import { VolunteerDashboard }')) {
    code = code.replace(
        /import { TrackDeliveriesContent } from '.\/pages\/TrackDeliveriesContent';/g,
        `import { TrackDeliveriesContent } from './pages/TrackDeliveriesContent';\nimport { VolunteerDashboard } from './pages/VolunteerDashboard';`
    );
}

if (!code.includes('path="/volunteer/:trackingId"')) {
    code = code.replace(
        /{?\/\* Fallback \*\//g,
        `<Route path="/volunteer/:trackingId" element={<VolunteerDashboard />} />\n            {/* Fallback */`
    );
}

fs.writeFileSync('src/App.tsx', code);
console.log("Updated App routes");
