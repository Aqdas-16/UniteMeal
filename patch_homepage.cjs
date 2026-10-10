const fs = require('fs');
let code = fs.readFileSync('src/pages/NGOHomepage.tsx', 'utf8');

if (!code.includes('import { RestaurantRating }')) {
    code = code.replace("import { DonationDetailsModal } from '../components/dashboard/DonationDetailsModal';", "import { DonationDetailsModal } from '../components/dashboard/DonationDetailsModal';\nimport { RestaurantRating } from '@/components/ui/RestaurantRating';");
}

code = code.replace(
    '<span className="flex items-center text-amber-500 font-medium"><Star className="w-3 h-3 mr-0.5 fill-current" /> 4.8</span>',
    '<RestaurantRating donorId={d.donor_id || d.restaurant_id || d.profiles?.id} showCount />'
);

fs.writeFileSync('src/pages/NGOHomepage.tsx', code);
