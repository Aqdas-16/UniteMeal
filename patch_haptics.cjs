const fs = require('fs');
let code = fs.readFileSync('src/pages/VolunteerDashboard.tsx', 'utf8');

const importHaptics = `import { Haptics, ImpactStyle } from '@capacitor/haptics';`;
if (!code.includes(importHaptics)) {
    code = code.replace(
        "import { useParams } from 'react-router-dom';",
        "import { useParams } from 'react-router-dom';\n" + importHaptics
    );
}

// Add Haptics.impact({ style: ImpactStyle.Heavy }); to startPickup
code = code.replace(
    /const handleAction = async \(action: string\) => \{/,
    `const handleAction = async (action: string) => {
        try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch (e) {}`
);

fs.writeFileSync('src/pages/VolunteerDashboard.tsx', code);
console.log("Added Haptics to VolunteerDashboard.tsx");
