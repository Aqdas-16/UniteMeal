const fs = require('fs');
let code = fs.readFileSync('src/pages/VolunteerDashboard.tsx', 'utf8');

// The instructions require that "Start Pickup" starts the tracking.
// We can just add a state `isTrackingStarted` but the status `in_transit_to_restaurant` already means it started.
// Let's ensure the watchPosition only runs if the status is NOT waiting.

code = code.replace(
    "if (!tracking || tracking.status === 'completed') {",
    "if (!tracking || tracking.status === 'completed' || tracking.status === 'waiting') {"
);

fs.writeFileSync('src/pages/VolunteerDashboard.tsx', code);
console.log("Updated VolunteerDashboard.tsx");
