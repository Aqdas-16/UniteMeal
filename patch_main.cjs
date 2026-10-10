const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf-8');

if (!code.includes('Geocoding Service: You must enable Billing')) {
    code = `
const originalConsoleError = console.error;
console.error = (...args) => {
    if (typeof args[0] === 'string' && (args[0].includes('Geocoding Service: You must enable Billing') || args[0].includes('Google Maps JavaScript API warning'))) {
        return;
    }
    originalConsoleError(...args);
};
` + code;
    fs.writeFileSync('src/main.tsx', code);
}
