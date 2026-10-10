const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Footer.tsx', 'utf8');

code = code.replace(/import \{ Github, Linkedin, Twitter, Instagram \} from "lucide-react";/, 'import { Globe, Mail, Link as LinkIcon, Share2 } from "lucide-react";');
code = code.replace(/<Linkedin/g, '<Globe');
code = code.replace(/<Github/g, '<Mail');
code = code.replace(/<Instagram/g, '<Share2');
code = code.replace(/<Twitter/g, '<LinkIcon');

fs.writeFileSync('src/components/layout/Footer.tsx', code);
console.log("Fixed Footer.tsx");
