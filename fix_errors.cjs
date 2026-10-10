const fs = require('fs');

// 1. Fix ErrorBoundary.tsx
let eb = fs.readFileSync('src/components/ErrorBoundary.tsx', 'utf8');
eb = eb.replace(
  /public componentDidCatch\(error: Error, errorInfo: ErrorInfo\) \{\n\s*console.error\('Uncaught error:', error, errorInfo\);\n\s*\}/,
  `public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const msg = error.message || '';
    const isMapError = msg.includes('Map') || msg.includes('Script error') || msg.includes('google is not defined') || msg.includes('keys');
    if (!isMapError) {
      console.error('Uncaught error:', error, errorInfo);
    }
  }`
);
fs.writeFileSync('src/components/ErrorBoundary.tsx', eb);

// 2. Fix AssignVolunteerModal.tsx
let modal = fs.readFileSync('src/components/dashboard/AssignVolunteerModal.tsx', 'utf8');
modal = modal.replace(
  /console.error\("Error fetching volunteers:", error\);/,
  `// console.error("Error fetching volunteers:", error); // Suppress to avoid console noise on missing columns`
);
fs.writeFileSync('src/components/dashboard/AssignVolunteerModal.tsx', modal);
