const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = '<Route path="documents" element={<DonorDocuments />} />';
const replacement = target + '\n                <Route path="settings" element={<div className="p-4 md:p-8 max-w-6xl mx-auto w-full"><SettingsPage /></div>} />';

if (!code.includes('<Route path="settings" element={<div className="p-4 md:p-8 max-w-6xl mx-auto w-full"><SettingsPage /></div>} />')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', code);
}
