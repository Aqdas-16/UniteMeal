const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

const regex = /<SelectContent>\s*<SelectItem value="cooked">Cooked Food<\/SelectItem>\s*<SelectItem value="raw">Raw Ingredients<\/SelectItem>\s*<SelectItem value="packaged">Packaged Goods<\/SelectItem>\s*<SelectItem value="produce">Fresh Produce<\/SelectItem>\s*<\/SelectContent>/m;

code = code.replace(regex, `<SelectContent>
        {CATEGORY_OPTIONS.map(cat => (
            <SelectItem key={cat.id} value={cat.id}>{cat.title}</SelectItem>
        ))}
    </SelectContent>`);

fs.writeFileSync('src/pages/SettingsPage.tsx', code);
console.log("Patched SettingsPage content");
