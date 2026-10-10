const fs = require('fs');
const lines = fs.readFileSync('server.ts', 'utf8').split('\n');

const viteStart = lines.findIndex(l => l.includes('// Vite middleware for development'));
let viteEnd = -1;
for (let i = viteStart; i < lines.length; i++) {
    if (lines[i].includes('res.sendFile(path.join(distPath, \'index.html\'));')) {
        viteEnd = i + 2; // skip the closing brace for app.get and the closing brace for else
        break;
    }
}

if (viteStart !== -1 && viteEnd !== -1) {
    const viteBlock = lines.splice(viteStart, viteEnd - viteStart + 1);
    const listenStart = lines.findIndex(l => l.includes('app.listen(PORT, "0.0.0.0"'));
    lines.splice(listenStart, 0, ...viteBlock);
    fs.writeFileSync('server.ts', lines.join('\n'));
    console.log("Fixed!");
} else {
    console.log(viteStart, viteEnd);
}
