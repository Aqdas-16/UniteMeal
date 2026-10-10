const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DonationHistory.tsx', 'utf8');

code = code.replace(
    ".select('*, deliveries(*, ngos(*))')",
    ".select('*, ngo:profiles!donations_ngo_id_fkey(full_name, business_name), deliveries(*)')"
);

code = code.replace(
    "{selectedDonation.deliveries?.[0]?.ngos?.name || 'Pending'}",
    "{selectedDonation.ngo?.business_name || selectedDonation.ngo?.full_name || 'Pending'}"
);

fs.writeFileSync('src/components/dashboard/DonationHistory.tsx', code);
