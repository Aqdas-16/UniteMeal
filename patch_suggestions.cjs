const fs = require('fs');
let code = fs.readFileSync('src/components/FloatingAssistant.tsx', 'utf8');

const importRegex = /import \{ useAuth \} from '@\/components\/auth\/AuthContext';/;
if (!importRegex.test(code)) {
    code = code.replace(`import { Input } from '@/components/ui/input';`, `import { Input } from '@/components/ui/input';\nimport { useAuth } from '@/components/auth/AuthContext';`);
}

// Extract useAuth
const funcStart = `export function FloatingAssistant() {`;
if (code.includes(funcStart) && !code.includes(`const { profile } = useAuth();`)) {
    code = code.replace(funcStart, `${funcStart}\n  const { profile } = useAuth();`);
}

const target = `{["How does NGO work?", "Delivery partners?", "Certificate?"].map(q => (`;
const replacement = `{(() => {
                if (profile?.role === 'donor') return ["How to donate food?", "Certificate?", "Is it free?"];
                if (profile?.role === 'ngo') return ["How does NGO work?", "Delivery partners?", "Certificate?"];
                if (profile?.role === 'volunteer') return ["How deliveries work?", "Certificate?", "Live tracking?"];
                return ["How does it work?", "How to donate food?", "Cost?"];
              })().map(q => (`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/FloatingAssistant.tsx', code);
