const fs = require('fs');
let code = fs.readFileSync('components/auth/AuthContext.tsx', 'utf-8');

code = code.replace(
    /enhancedProfile\.business_name = restData\.business_name;/,
    `enhancedProfile.business_name = restData.business_name;
            enhancedProfile.verification_status = restData.verification_status;`
);

code = code.replace(
    /type UserProfile = \{/,
    `type UserProfile = {
  verification_status?: 'pending' | 'verified' | 'rejected' | 'approved';`
);

fs.writeFileSync('components/auth/AuthContext.tsx', code);
