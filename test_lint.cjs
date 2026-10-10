const { execSync } = require('child_process');
try {
  const out = execSync('npx tsc --noEmit', { encoding: 'utf8' });
  console.log("Success:\n", out);
} catch (e) {
  console.log("Error:\n", e.stdout);
}
