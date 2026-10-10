const fs = require('fs');

// 1. Update App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
if (!appCode.includes('import { VolunteerProfile }')) {
    appCode = appCode.replace(
        "import { VolunteerPortal } from './pages/VolunteerPortal';",
        "import { VolunteerPortal } from './pages/VolunteerPortal';\nimport { VolunteerProfile } from './pages/VolunteerProfile';"
    );
}

appCode = appCode.replace(
    /<Route path="settings" element=\{<SettingsPage \/>\} \/>/g,
    '<Route path="profile" element={<VolunteerProfile />} />'
);
fs.writeFileSync('src/App.tsx', appCode);

// 2. Update Layout
let layoutCode = fs.readFileSync('src/components/layout/VolunteerDashboardLayout.tsx', 'utf8');
layoutCode = layoutCode.replace(
    /href: '\/dashboard\/volunteer\/settings'/g,
    "href: '/dashboard/volunteer/profile'"
);
fs.writeFileSync('src/components/layout/VolunteerDashboardLayout.tsx', layoutCode);
