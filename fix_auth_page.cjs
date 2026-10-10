const fs = require('fs');

let auth = fs.readFileSync('src/pages/AuthPage.tsx', 'utf8');

// Update selectedRole state type
auth = auth.replace(
  /const\s+\[selectedRole,\s*setSelectedRole\]\s*=\s*useState<\s*"donor"\s*\|\s*"ngo"\s*>\("donor"\);/,
  'const [selectedRole, setSelectedRole] = useState<"donor" | "ngo" | "volunteer">("donor");'
);

// Add "volunteer" to the role buttons
auth = auth.replace(
  /\{\s*id:\s*"ngo",\s*label:\s*"NGO"\s*\},/,
  '{ id: "ngo", label: "NGO" },\n                    { id: "volunteer", label: "Volunteer" },'
);

// Add redirect for volunteer
auth = auth.replace(
  /if\s*\(profile\.role\s*===\s*"ngo"\)\s*return\s*<Navigate\s+to="\/dashboard\/ngo"\s+replace\s*\/>;/,
  'if (profile.role === "ngo") return <Navigate to="/dashboard/ngo" replace />;\n    if (profile.role === "volunteer") return <Navigate to="/dashboard/volunteer" replace />;'
);

fs.writeFileSync('src/pages/AuthPage.tsx', auth);
