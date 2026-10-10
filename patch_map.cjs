const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/NGOLiveMap.tsx', 'utf8');

if (!code.includes('import { RestaurantRating }')) {
    code = code.replace("import { Truck, MapPin, Building, ShieldCheck, Navigation, ExternalLink, Star } from 'lucide-react';", "import { Truck, MapPin, Building, ShieldCheck, Navigation, ExternalLink, Star } from 'lucide-react';\nimport { RestaurantRating } from '@/components/ui/RestaurantRating';");
}

code = code.replace(
    '<Star className="w-3 h-3 text-amber-500 fill-amber-500" />\n                                   <span className="text-xs font-medium text-slate-700">4.8</span>',
    '<RestaurantRating donorId={selectedRestaurant.id || selectedRestaurant.user_id} />'
);

fs.writeFileSync('src/components/dashboard/NGOLiveMap.tsx', code);
