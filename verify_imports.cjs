const fs = require('fs');

function checkProfile(file) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf-8');
    if (code.includes('handleBack')) {
        if (!code.includes('const { user, profile } = useAuth()') && !code.includes('const { profile } = useAuth()')) {
            if (code.includes('const { user } = useAuth()')) {
                code = code.replace('const { user } = useAuth()', 'const { user, profile } = useAuth()');
                fs.writeFileSync(file, code);
                console.log('Fixed profile in', file);
            }
        }
    }
}

checkProfile('src/pages/SettingsPage.tsx');
checkProfile('src/components/ui/TrackDeliveriesContent.tsx');
checkProfile('src/pages/NotificationsPage.tsx');
checkProfile('src/pages/DonorAnalytics.tsx');
checkProfile('src/pages/DonorDocuments.tsx');
checkProfile('src/pages/DonorProfile.tsx');
