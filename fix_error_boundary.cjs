const fs = require('fs');

let code = fs.readFileSync('src/components/ErrorBoundary.tsx', 'utf8');

code = code.replace(
  /const isMapError = this.state.errorMessage.includes\('Map'\) \|\| \n\s*this.state.errorMessage.includes\('Script error'\) \|\| \n\s*this.state.errorMessage.includes\('google is not defined'\);/,
  `const isMapError = this.state.errorMessage.includes('Map') || 
                         this.state.errorMessage.includes('Script error') || 
                         this.state.errorMessage.includes('google is not defined') ||
                         this.state.errorMessage.includes('keys'); // AdvancedMarker keys error`
);

fs.writeFileSync('src/components/ErrorBoundary.tsx', code);
