const fs = require('fs');
let code = fs.readFileSync('src/pages/AuthPage.tsx', 'utf8');

// Hide "Create Account" text if role is volunteer
const oldText = `{isLogin ? "Create Account" : "Sign In"}`;
const newText = `{selectedRole === 'volunteer' ? "" : isLogin ? "Create Account" : "Sign In"}`;
code = code.replace(oldText, newText);

// Force login mode for volunteer
const oldEffect = `  useEffect(() => {
    localStorage.setItem("pendingRole", selectedRole);
  }, [selectedRole]);`;
const newEffect = `  useEffect(() => {
    localStorage.setItem("pendingRole", selectedRole);
    if (selectedRole === 'volunteer') setIsLogin(true);
  }, [selectedRole]);`;
code = code.replace(oldEffect, newEffect);

fs.writeFileSync('src/pages/AuthPage.tsx', code);
console.log("Updated AuthPage.tsx");
