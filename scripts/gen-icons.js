// Run: node scripts/gen-icons.js
const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

function drawIcon(size) {
  const c = createCanvas(size, size);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, size, size);

  const pw = size * 0.06, ph = size * 0.32, gap = size * 0.08;
  ctx.shadowBlur = size * 0.06;

  ctx.shadowColor = "#00e5ff";
  ctx.fillStyle = "#00e5ff";
  ctx.beginPath();
  ctx.roundRect(gap, size / 2 - ph / 2, pw, ph, pw / 2);
  ctx.fill();

  ctx.shadowColor = "#ff4081";
  ctx.fillStyle = "#ff4081";
  ctx.beginPath();
  ctx.roundRect(size - gap - pw, size / 2 - ph / 2, pw, ph, pw / 2);
  ctx.fill();

  ctx.shadowColor = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.07, 0, Math.PI * 2);
  ctx.fill();

  return c;
}

function drawPreview() {
  const c = createCanvas(1200, 630);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, 1200, 630);

  ctx.font = "bold 90px monospace";
  ctx.fillStyle = "#00e5ff";
  ctx.shadowBlur = 30;
  ctx.shadowColor = "#00e5ff";
  ctx.textAlign = "center";
  ctx.fillText("PaddleForge", 600, 280);

  ctx.font = "36px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.shadowBlur = 0;
  ctx.fillText("AI Pong Arena", 600, 350);

  ctx.font = "22px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillText("Built by AnointedTheDeveloper", 600, 430);

  return c;
}

const outDir = path.join(__dirname, "../public/icons");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, "icon-192.png"), drawIcon(192).toBuffer("image/png"));
fs.writeFileSync(path.join(outDir, "icon-512.png"), drawIcon(512).toBuffer("image/png"));
fs.writeFileSync(path.join(__dirname, "../public/preview.png"), drawPreview().toBuffer("image/png"));

console.log("Icons and preview generated.");
