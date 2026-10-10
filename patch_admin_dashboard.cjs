const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

if (!code.includes('import { AdminNGOVerificationContent }')) {
    code = code.replace(
        "import { useEffect, useState } from 'react';", 
        "import { useEffect, useState } from 'react';\nimport { AdminNGOVerificationContent } from './AdminFeatures';"
    );
}

// Replace quick actions with AdminNGOVerificationContent
const startStr = '{/* QUICK ACTIONS & EMERGENCY */}';
const endStr = '{/* MAP */}';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    const newSection = `
      {/* VERIFICATIONS */}
      <div className="mb-6 bg-white dark:bg-[#111113] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <AdminNGOVerificationContent />
      </div>
      
      `;
      
    code = code.substring(0, startIndex) + newSection + code.substring(endIndex);
    fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
}
