const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

if (!code.includes('maximumFileSizeToCacheInBytes')) {
    code = code.replace(
        "registerType: 'autoUpdate',",
        "registerType: 'autoUpdate',\n        workbox: {\n            maximumFileSizeToCacheInBytes: 5000000\n        },"
    );
    fs.writeFileSync('vite.config.ts', code);
    console.log("Patched vite.config.ts for PWA limit");
}
