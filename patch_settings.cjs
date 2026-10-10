const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

code = code.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { CATEGORY_OPTIONS } from '@/lib/constants';"
);

code = code.replace("default_food_category: 'cooked',", "default_food_category: 'Cooked',");

code = code.replace(
    /<SelectContent>\s*<SelectItem value="cooked">Cooked Food<\/SelectItem>\s*<SelectItem value="raw">Raw Ingredients<\/SelectItem>\s*<SelectItem value="packaged">Packaged Food<\/SelectItem>\s*<\/SelectContent>/,
    `<SelectContent>
        {CATEGORY_OPTIONS.map(cat => (
            <SelectItem key={cat.id} value={cat.id}>{cat.title}</SelectItem>
        ))}
    </SelectContent>`
);

fs.writeFileSync('src/pages/SettingsPage.tsx', code);
console.log("Patched SettingsPage.tsx");
