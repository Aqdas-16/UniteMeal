const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CreateDonation.tsx', 'utf8');

const regex = /const getPlaceholderImage = \(category: string\) => \{[\s\S]*?return 'https:\/\/images.unsplash.com\/photo-1493770348161-369560ae357d\?auto=format\&fit=crop\&w=400\&q=80';\n  \};/m;
code = code.replace(regex, `const getPlaceholderImage = (category: string) => {
    switch (category) {
      case 'Cooked': return 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&q=80';
      case 'Produce': return 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80';
      case 'Packaged': return 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=400&q=80';
      case 'Bakery': return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80';
      case 'Dairy': return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80';
      case 'Beverage': return 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=400&q=80';
      default: return 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&q=80';
    }
  };`);
  
fs.writeFileSync('src/components/dashboard/CreateDonation.tsx', code);
console.log("Patched getPlaceholderImage");
