const fs = require('fs');
let code = fs.readFileSync('src/pages/DonorProfile.tsx', 'utf8');

code = code.replace(
    "verification_status: restData?.location_verification_status || 'pending'",
    "verification_status: profile?.verification_status || restData?.verification_status || 'pending'"
);

fs.writeFileSync('src/pages/DonorProfile.tsx', code);
