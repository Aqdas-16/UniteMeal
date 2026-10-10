const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace("import { usePushNotifications } from '@/hooks/usePushNotifications';", "import { usePushNotifications } from './hooks/usePushNotifications';");
fs.writeFileSync('src/App.tsx', code);
console.log("Fixed usePushNotifications path in App.tsx");
