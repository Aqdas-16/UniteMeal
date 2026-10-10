const fs = require('fs');

// Update ProtectedRoute.tsx
let pr = fs.readFileSync('components/auth/ProtectedRoute.tsx', 'utf8');
pr = pr.replace(/return <Navigate to=\{\`\/dashboard\/\$\{profile.role\}\`\} replace \/>;/g, 
  `const rolePath = profile.role === 'donor' ? 'restaurant' : profile.role;
    return <Navigate to={\`/dashboard/\${rolePath}\`} replace />;`);
fs.writeFileSync('components/auth/ProtectedRoute.tsx', pr);

// Update App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/<Route path="\/dashboard\/donor"/g, '<Route path="/dashboard/restaurant"');
app = app.replace(/<Navigate to="\/dashboard\/donor"/g, '<Navigate to="/dashboard/restaurant"');
fs.writeFileSync('src/App.tsx', app);

// Update AuthPage.tsx
let auth = fs.readFileSync('src/pages/AuthPage.tsx', 'utf8');
auth = auth.replace(/<Navigate to="\/dashboard\/donor"/g, '<Navigate to="/dashboard/restaurant"');
fs.writeFileSync('src/pages/AuthPage.tsx', auth);

// Any other references
const files = [
  'src/components/layout/DonorDashboardLayout.tsx',
  'src/components/layout/Navbar.tsx',
  'src/components/layout/Footer.tsx'
];
for(const file of files) {
  if (fs.existsSync(file)) {
     let content = fs.readFileSync(file, 'utf8');
     content = content.replace(/\/dashboard\/donor/g, '/dashboard/restaurant');
     fs.writeFileSync(file, content);
  }
}
