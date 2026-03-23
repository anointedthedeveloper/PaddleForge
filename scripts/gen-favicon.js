// Run: node scripts/gen-favicon.js
// No dependencies required — uses only Node.js built-ins
const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "../public");

// SVG favicon — works in all modern browsers
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#0a0a0f"/>
  <!-- Left paddle (cyan) -->
  <rect x="8" y="20" width="7" height="24" rx="3" fill="#00e5ff"/>
  <!-- Right paddle (pink) -->
  <rect x="49" y="20" width="7" height="24" rx="3" fill="#ff4081"/>
  <!-- Ball (white) -->
  <circle cx="32" cy="32" r="5" fill="#ffffff"/>
  <!-- Center dashed line -->
  <line x1="32" y1="4" x2="32" y2="60" stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-dasharray="4,5"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, "favicon.svg"), svg);
console.log("favicon.svg generated");

// Also write a simple HTML snippet to confirm usage
console.log("Add to <Head>:");
console.log('  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />');
console.log('  <link rel="icon" type="image/png" href="/icons/icon-192.png" sizes="192x192" />');
console.log('  <link rel="apple-touch-icon" href="/icons/icon-192.png" />');
