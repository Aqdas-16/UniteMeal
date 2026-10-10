const fs = require('fs');
let code = fs.readFileSync('src/components/layout/NGODashboardLayout.tsx', 'utf8');
if (!code.includes('Map,')) {
    code = code.replace(/import \{ (.*) \} from 'lucide-react';/, "import { $1, Map, Users, History, BarChart3, Search } from 'lucide-react';");
}
fs.writeFileSync('src/components/layout/NGODashboardLayout.tsx', code);
