// node scripts/gen-icons.js  — no dependencies, pure Node.js
const fs = require("fs");
const path = require("path");
const { createCanvas } = (() => {
  try { return require("canvas"); } catch { return null; }
})() || {};

const outDir = path.join(__dirname, "../public/icons");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

if (createCanvas) {
  // Use node-canvas if available
  function makeIcon(size) {
    const c = createCanvas(size, size);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, size, size);
    const pw = Math.round(size * 0.09), ph = Math.round(size * 0.34), gap = Math.round(size * 0.1);
    ctx.fillStyle = "#00e5ff";
    ctx.beginPath(); ctx.roundRect(gap, size/2-ph/2, pw, ph, pw/2); ctx.fill();
    ctx.fillStyle = "#ff4081";
    ctx.beginPath(); ctx.roundRect(size-gap-pw, size/2-ph/2, pw, ph, pw/2); ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(size/2, size/2, size*0.08, 0, Math.PI*2); ctx.fill();
    return c.toBuffer("image/png");
  }
  fs.writeFileSync(path.join(outDir, "icon-192.png"), makeIcon(192));
  fs.writeFileSync(path.join(outDir, "icon-512.png"), makeIcon(512));
  console.log("Icons generated with node-canvas.");
} else {
  // Fallback: write minimal valid 1x1 PNG then scale via SVG embed trick
  // Actually write a proper minimal PNG using raw bytes
  function minimalPNG(size, r, g, b) {
    // We'll write a valid PNG with a solid color background + simple shapes
    // Using jimp-free approach: write an SVG and note it
    console.log("node-canvas not found. Run: npm install canvas --save-dev");
    console.log("Then re-run: node scripts/gen-icons.js");
    process.exit(1);
  }
  minimalPNG(192, 10, 10, 15);
}

// Generate preview.png
if (createCanvas) {
  const c = createCanvas(1200, 630);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#0a0a0f"; ctx.fillRect(0, 0, 1200, 630);
  ctx.font = "bold 88px monospace"; ctx.fillStyle = "#00e5ff";
  ctx.shadowBlur = 30; ctx.shadowColor = "#00e5ff"; ctx.textAlign = "center";
  ctx.fillText("PaddleForge", 600, 280);
  ctx.font = "34px monospace"; ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.shadowBlur = 0;
  ctx.fillText("AI Pong Arena", 600, 350);
  ctx.font = "20px monospace"; ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillText("Built by AnointedTheDeveloper", 600, 420);
  fs.writeFileSync(path.join(__dirname, "../public/preview.png"), c.toBuffer("image/png"));
  console.log("preview.png generated.");
}
