const fs = require('fs');

function disableRouting(filePath) {
    if (fs.existsSync(filePath)) {
        let code = fs.readFileSync(filePath, 'utf8');
        // We will just add a return statement before the route call
        if (filePath.includes('TrackDeliveriesContent.tsx')) {
            code = code.replace(/directionsService\.route\(\{/g, 'return; // Disabled due to missing Directions API\n        directionsService.route({');
        } else if (filePath.includes('VolunteerPortal.tsx')) {
            code = code.replace(/directionsSvc\.route\(\{/g, 'return; // Disabled due to missing Directions API\n       directionsSvc.route({');
        } else if (filePath.includes('NGOLiveMap.tsx')) {
            code = code.replace(/directionsService\.route\(\{/g, 'return; // Disabled due to missing Directions API\n    directionsService.route({');
        }
        fs.writeFileSync(filePath, code);
    }
}

disableRouting('src/pages/TrackDeliveriesContent.tsx');
disableRouting('src/pages/VolunteerPortal.tsx');
disableRouting('src/components/dashboard/NGOLiveMap.tsx');

