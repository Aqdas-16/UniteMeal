const https = require('https');
const http = require('http');

function resolveUrl(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                resolve(res.headers.location);
            } else {
                resolve(url); // No redirect
            }
        });
        req.on('error', reject);
    });
}
