const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DonorDashboardLayout.tsx', 'utf8');
if (!code.includes('PlusCircle')) {
    code = code.replace(/import \{ (.*) \} from 'lucide-react';/, "import { $1, PlusCircle } from 'lucide-react';");
}
fs.writeFileSync('src/components/layout/DonorDashboardLayout.tsx', code);
