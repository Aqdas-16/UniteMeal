const fs = require('fs');

let content = fs.readFileSync('src/pages/NGOHomepage.tsx', 'utf8');
content = content.replace(/import \{ DonorLiveMap \} from '\.\.\/components\/dashboard\/DonorLiveMap';/, "import { NGOLiveMap } from '../components/dashboard/NGOLiveMap';");
content = content.replace(/<DonorLiveMap userId=\{user\?\.uid\} \/>/g, '<NGOLiveMap userId={user?.uid} />');

fs.writeFileSync('src/pages/NGOHomepage.tsx', content);
