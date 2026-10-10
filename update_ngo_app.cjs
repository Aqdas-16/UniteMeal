const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

if (!code.includes('import { NGOVolunteersContent }')) {
    code = code.replace(
        /import \{ NGODashboard \} from '\.\/pages\/NGODashboard';/,
        `import { NGODashboard } from './pages/NGODashboard';\nimport { NGOVolunteersContent } from './pages/NGOVolunteersContent';`
    );
}

// Ensure the route renders NGOVolunteersContent instead of whatever it might be doing (wait, what is it rendering right now?)
// In App.tsx earlier I saw: <Route path="volunteers" element={<div ...>...}
// Actually, earlier there was no path="volunteers" in App.tsx! Only in NGODashboardLayout there was a link to it.
if (!code.includes('<Route path="volunteers"')) {
    code = code.replace(
        /<Route path="requests" element=\{<div className="p-4 md:p-8 max-w-6xl mx-auto"><NGORequestsContent \/><\/div>\} \/>/,
        `<Route path="requests" element={<div className="p-4 md:p-8 max-w-6xl mx-auto"><NGORequestsContent /></div>} />\n                <Route path="volunteers" element={<div className="p-4 md:p-8 max-w-6xl mx-auto"><NGOVolunteersContent /></div>} />`
    );
}

fs.writeFileSync('src/App.tsx', code);
