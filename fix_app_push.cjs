const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
if (!code.includes("import { usePushNotifications }")) {
    code = "import { usePushNotifications } from '@/hooks/usePushNotifications';\n" + code;
}
fs.writeFileSync('src/App.tsx', code);
console.log("Fixed usePushNotifications in App.tsx");
