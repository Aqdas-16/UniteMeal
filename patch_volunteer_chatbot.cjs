const fs = require('fs');
let code = fs.readFileSync('src/components/layout/VolunteerDashboardLayout.tsx', 'utf8');

if (!code.includes('FloatingAssistant')) {
  code = `import { FloatingAssistant } from '@/src/components/FloatingAssistant';\n` + code;
  code = code.replace(
    `    </div>\n  );\n}`,
    `      <FloatingAssistant />\n    </div>\n  );\n}`
  );
  fs.writeFileSync('src/components/layout/VolunteerDashboardLayout.tsx', code);
}
