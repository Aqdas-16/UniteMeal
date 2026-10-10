const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CertificateCard.tsx', 'utf8');

const target = `<h2 className="text-5xl font-serif text-slate-900 mb-6 font-bold" style={{ fontFamily: 'Georgia, serif' }}>{profile?.full_name || 'Valued Member'}</h2>`;
const replacement = `<h2 className="text-3xl md:text-4xl text-slate-900 mb-6 font-medium italic" style={{ fontFamily: '"Playfair Display", "Brush Script MT", "Great Vibes", cursive, serif', letterSpacing: '1px' }}>{profile?.full_name || 'Valued Member'}</h2>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/dashboard/CertificateCard.tsx', code);
