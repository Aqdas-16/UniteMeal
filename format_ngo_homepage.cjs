const fs = require('fs');
let code = fs.readFileSync('src/pages/NGOHomepage.tsx', 'utf-8');

// The current order after Marquee is:
// 1. Welcome + Action Cards (Feature Cards)
// 2. KPI Cards (Statistics)
// 3. Available Donations (Latest Donations)
// 4. Recent Activity
// 5. Live Delivery Google Map
// 6. Why Partner with UniteMeal
// 7. FAQs

// Let's remove 5, 6, 7 and reorder KPI Cards before Action Cards.

const kpiRegex = /\{\/\* 3\. NGO KPI CARDS \*\/\}.*?(?=\{\/\* 3\.5 AVAILABLE DONATIONS \*\/\})/s;
const actionRegex = /\{\/\* WELCOME SECTION \*\/\}.*?(?=\{\/\* 3\. NGO KPI CARDS \*\/\})/s;

const kpiMatch = code.match(kpiRegex);
const actionMatch = code.match(actionRegex);

if (kpiMatch && actionMatch) {
    let newContent = kpiMatch[0] + "\n" + actionMatch[0];
    
    // Replace the old combined block with the reordered block
    code = code.replace(actionMatch[0] + kpiMatch[0], newContent);
}

// Remove everything from "5. LIVE DELIVERY GOOGLE MAP" down to before Footer
const mapToFooterRegex = /\{\/\* 5\. LIVE DELIVERY GOOGLE MAP \*\/\}.*?(?=\{\/\* 7\. FOOTER \*\/\})/s;
code = code.replace(mapToFooterRegex, '');
// Note: Footer might not be labelled 7. FOOTER in NGOHomepage.tsx. Let's check.

fs.writeFileSync('src/pages/NGOHomepage.tsx', code);
