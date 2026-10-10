const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace("function PushWrapper({ children }: { children: React.ReactNode })", "import React from 'react';\nfunction PushWrapper({ children }: { children: React.ReactNode })");
fs.writeFileSync('src/App.tsx', code);
console.log("Fixed React in App.tsx");
