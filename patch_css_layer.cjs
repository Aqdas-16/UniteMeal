const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

const target = `@layer components {`;
const replacement = `@layer components {
  /* Enhance standard cards across all roles */
  .card, [class*="Card_"], [class^="Card"], .shadow-sm {
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }
  
  .card:hover, [class*="Card_"]:hover, [class^="Card"]:not(.no-hover):hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.03) !important;
    border-color: rgba(var(--color-ring) / 0.1) !important;
  }
  
  .dark .card:hover, .dark [class*="Card_"]:hover, .dark [class^="Card"]:not(.no-hover):hover {
    box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.3), 0 4px 12px -2px rgba(0, 0, 0, 0.2) !important;
    border-color: rgba(255,255,255,0.12) !important;
  }
  
  /* Modern Button Enhancements */
  button {
    transition: all 0.2s ease;
  }
  button:active {
    transform: scale(0.97) !important;
  }
`;

if (!code.includes("/* Enhance standard cards across all roles */")) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/index.css', code);
}
