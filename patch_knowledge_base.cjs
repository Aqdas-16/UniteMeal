const fs = require('fs');
let code = fs.readFileSync('src/lib/chatbotKnowledgeBase.ts', 'utf8');

const target = `export const predefinedQuestions = [`;
const replacement = `export const predefinedQuestions = [
  {
    intent: "restaurant_donate",
    keywords: ["restaurant", "hotel", "donor", "signup", "register", "join", "contribute", "donate food", "how to donate", "give food"],
    answer: "As a Food Contributor (Restaurant/Hotel), you can sign up on the platform, create a profile, and start posting available food donations. When a donation is posted, nearby verified NGOs are notified."
  },
  {
    intent: "ngo_how_it_works",
    keywords: ["ngo", "how it works", "request food", "accept", "receive"],
    answer: "Verified NGOs can browse available food donations from nearby restaurants. Once you accept a donation, you must assign a member of your internal NGO Team (Delivery Partner) to pick it up safely."
  },
  {
    intent: "volunteer_delivery",
    keywords: ["volunteer", "delivery partner", "team member", "who delivers", "deliver"],
    answer: "For safety and accountability, we do not use third-party delivery fleets. All food pickups are handled strictly by the verified internal team members (Delivery Partners) of the receiving NGO."
  },
  {
    intent: "features",
    keywords: ["features", "analytics", "tracking", "dashboard", "live map"],
    answer: "UniteMeal features real-time delivery tracking, live analytics dashboards, a zero food waste engine, AI routing, and milestone certificates for active participants."
  },
  {
    intent: "certificates",
    keywords: ["certificate", "milestone", "reward", "recognition"],
    answer: "UniteMeal awards digital certificates to top contributors! Restaurants receive a certificate after 10 donations. NGOs receive one after accepting 10 donations. Team Members earn one after completing 10 deliveries."
  },
  {
    intent: "cost",
    keywords: ["cost", "free", "price", "pay"],
    answer: "UniteMeal is a completely free platform designed to rescue food and fight hunger. There are no hidden fees for Restaurants or NGOs."
  }
];`;

code = code.replace(/export const predefinedQuestions = \[[\s\S]*?\];/, replacement);

fs.writeFileSync('src/lib/chatbotKnowledgeBase.ts', code);
