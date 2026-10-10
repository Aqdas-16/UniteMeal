const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DonorLiveMap.tsx', 'utf8');

const dupCode = `<a href={\`/dashboard/ngo/restaurants/\${rId}\`} className="mt-3 block text-center text-xs bg-indigo-50 text-indigo-700 font-bold py-1.5 rounded hover:bg-indigo-100 transition-colors">
                              View Profile
                           </a>
                           <a href={\`/dashboard/ngo/restaurants/\${rId}\`} className="mt-3 block text-center text-xs bg-indigo-50 text-indigo-700 font-bold py-1.5 rounded hover:bg-indigo-100 transition-colors">
                              View Profile
                           </a>`;
const replacement = `<a href={\`/dashboard/ngo/restaurants/\${rId}\`} className="mt-3 block text-center text-xs bg-indigo-50 text-indigo-700 font-bold py-1.5 rounded hover:bg-indigo-100 transition-colors">
                              View Profile
                           </a>`;
                           
code = code.replace(dupCode, replacement);
fs.writeFileSync('src/components/dashboard/DonorLiveMap.tsx', code);
