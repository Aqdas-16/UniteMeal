const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('usePushNotifications')) {
    code = code.replace(
        "import { AuthProvider } from './components/auth/AuthContext';",
        "import { AuthProvider } from './components/auth/AuthContext';\nimport { usePushNotifications } from './hooks/usePushNotifications';"
    );
    
    // Create a wrapper component
    const wrapper = `
function PushWrapper({ children }: { children: React.ReactNode }) {
    usePushNotifications();
    return <>{children}</>;
}`;

    code = code.replace(
        "export default function App() {",
        wrapper + "\n\nexport default function App() {"
    );
    
    code = code.replace(
        "<AuthProvider>",
        "<AuthProvider>\n        <PushWrapper>"
    );
    
    code = code.replace(
        "</AuthProvider>",
        "</PushWrapper>\n      </AuthProvider>"
    );

    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched App.tsx with PushNotifications");
}
