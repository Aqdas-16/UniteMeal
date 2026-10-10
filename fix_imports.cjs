const fs = require('fs');

const files = [
  'src/pages/DonorAnalytics.tsx',
  'src/pages/NGOAnalytics.tsx',
  'src/pages/VolunteerHistory.tsx',
  'src/components/FloatingAssistant.tsx'
];

files.forEach(file => {
  if(fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/@\/components\/dashboard\/CertificateCard/g, '@/src/components/dashboard/CertificateCard');
    code = code.replace(/@\/lib\/chatbotKnowledgeBase/g, '@/src/lib/chatbotKnowledgeBase');
    fs.writeFileSync(file, code);
  }
});
