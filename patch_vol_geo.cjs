const fs = require('fs');
let code = fs.readFileSync('src/pages/VolunteerDashboard.tsx', 'utf8');

const importGeo = `import { Geolocation } from '@capacitor/geolocation';`;
if (!code.includes(importGeo)) {
    code = code.replace(
        "import { useParams } from 'react-router-dom';",
        "import { useParams } from 'react-router-dom';\n" + importGeo
    );
}

// Replace navigator.geolocation
code = code.replace(/const id = navigator\.geolocation\.watchPosition\(/, `const watchCall = Geolocation.watchPosition(
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 },`);
            
// Geolocation.watchPosition returns a Promise resolving to a watchId string
// However, the signature is watchPosition(options, callback) -> Promise<string>
// Let's refactor this block entirely to make sure it handles the promise correctly.
