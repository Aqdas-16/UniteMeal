const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('import { SettingsPage }')) {
    code = code.replace(
        "import { VolunteerHistory } from './pages/VolunteerHistory';", 
        "import { VolunteerHistory } from './pages/VolunteerHistory';\nimport { SettingsPage } from './pages/SettingsPage';"
    );
}

const target = '<Route path="users" element={<div className="p-4 md:p-8"><AdminUsersContent /></div>} />';
const replacement = target + '\n                <Route path="settings" element={<div className="p-4 md:p-8 max-w-6xl mx-auto"><SettingsPage /></div>} />';

if (!code.includes('path="settings"')) {
    code = code.replace(target, replacement);
}

fs.writeFileSync('src/App.tsx', code);
