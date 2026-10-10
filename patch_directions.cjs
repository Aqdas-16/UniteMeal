const fs = require('fs');

function patch(filePath, regex, replacement) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(regex, replacement);
        fs.writeFileSync(filePath, content);
    }
}

// TrackDeliveriesContent.tsx (uses callback, just handle error quietly if possible, actually callback handles it, but let's check)
patch('src/pages/TrackDeliveriesContent.tsx', 
    /directionsService\.route\(\{([\s\S]*?)\}, \(result, status\) => \{([\s\S]*?)\}\);/g, 
    'directionsService.route({$1}, (result, status) => {$2}).catch(e => console.warn("Directions Route failed", e));');

// VolunteerPortal.tsx (uses callback)
patch('src/pages/VolunteerPortal.tsx', 
    /directionsSvc\.route\(\{([\s\S]*?)\}, \(res: any, stat: any\) => \{([\s\S]*?)\}\);/g, 
    'directionsSvc.route({$1}, (res: any, stat: any) => {$2}).catch((e: any) => console.warn("Directions Route failed", e));');

// NGOLiveMap.tsx (uses promise)
patch('src/components/dashboard/NGOLiveMap.tsx', 
    /directionsService\.route\(\{([\s\S]*?)\}\)\.then\(response => \{([\s\S]*?)\}\);/g, 
    'directionsService.route({$1}).then(response => {$2}).catch(e => console.warn("Directions Route failed", e));');

