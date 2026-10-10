const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/pages/DonorFeatures.tsx');
let content = fs.readFileSync(file, 'utf8');

const startIdx = content.indexOf('export function DonationHistoryContent() {');
if (startIdx === -1) throw new Error('Not found start');
const endMarker = 'export function DonorRequestsContent() {';
const endIdx = content.indexOf(endMarker);
if (endIdx === -1) throw new Error('Not found end');

const targetContent = content.substring(startIdx, endIdx);
fs.writeFileSync('target_content.txt', targetContent);
console.log('Target content extracted.');
