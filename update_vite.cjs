const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

if (!code.includes('VitePWA')) {
    code = code.replace(
        "import {defineConfig} from 'vite';",
        "import {defineConfig} from 'vite';\nimport { VitePWA } from 'vite-plugin-pwa';"
    );
    
    const pwaConfig = `VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'UniteMeal',
          short_name: 'UniteMeal',
          description: 'Food Donation & Delivery Platform',
          theme_color: '#3FAE49',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
    })`;

    code = code.replace(
        "plugins: [react(), tailwindcss()],",
        "plugins: [react(), tailwindcss(), " + pwaConfig + "],"
    );
    fs.writeFileSync('vite.config.ts', code);
    console.log("Updated vite.config.ts for PWA");
}
