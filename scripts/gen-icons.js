// node scripts/gen-icons.js — zero dependencies, pure Node.js
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// ── Minimal PNG encoder ──────────────────────────────────────────────────────
function crc32(buf) {
  let c = 0xffffffff;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let v = i;
      for (let j = 0; j < 8; j++) v = (v & 1) ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
      t[i] = v;
    }
    return t;
  })());
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crcBuf = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(crcBuf));
  return Buffer.concat([len, t, data, crc]);
}

function encodePNG(width, height, pixels) {
  // pixels: Uint8Array of RGBA, row-major
  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      raw.push(pixels[i], pixels[i+1], pixels[i+2], pixels[i+3]);
    }
  }
  const compressed = zlib.deflateSync(Buffer.from(raw));
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB... wait, we need RGBA = color type 6
  ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]), // PNG signature
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Draw icon pixels ─────────────────────────────────────────────────────────
function drawIcon(size) {
  const pixels = new Uint8Array(size * size * 4);

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    // Alpha blend over existing
    const sa = a / 255, da = pixels[i+3] / 255;
    const oa = sa + da * (1 - sa);
    if (oa === 0) return;
    pixels[i]   = Math.round((r * sa + pixels[i]   * da * (1 - sa)) / oa);
    pixels[i+1] = Math.round((g * sa + pixels[i+1] * da * (1 - sa)) / oa);
    pixels[i+2] = Math.round((b * sa + pixels[i+2] * da * (1 - sa)) / oa);
    pixels[i+3] = Math.round(oa * 255);
  }

  function fillRect(x, y, w, h, r, g, b) {
    for (let py = y; py < y + h; py++)
      for (let px = x; px < x + w; px++)
        setPixel(px, py, r, g, b);
  }

  function fillCircle(cx, cy, radius, r, g, b) {
    for (let py = cy - radius; py <= cy + radius; py++)
      for (let px = cx - radius; px <= cx + radius; px++)
        if ((px-cx)**2 + (py-cy)**2 <= radius**2)
          setPixel(px, py, r, g, b);
  }

  function fillRoundRect(x, y, w, h, rx, r, g, b) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        // Corner check
        let inCorner = false;
        if (px < x+rx && py < y+rx)       inCorner = (px-x-rx)**2+(py-y-rx)**2 > rx**2;
        if (px >= x+w-rx && py < y+rx)    inCorner = (px-x-w+rx)**2+(py-y-rx)**2 > rx**2;
        if (px < x+rx && py >= y+h-rx)    inCorner = (px-x-rx)**2+(py-y-h+rx)**2 > rx**2;
        if (px >= x+w-rx && py >= y+h-rx) inCorner = (px-x-w+rx)**2+(py-y-h+rx)**2 > rx**2;
        if (!inCorner) setPixel(px, py, r, g, b);
      }
    }
  }

  // Background
  fillRect(0, 0, size, size, 10, 10, 15);

  const pw = Math.round(size * 0.09);
  const ph = Math.round(size * 0.34);
  const gap = Math.round(size * 0.1);
  const rx = Math.round(pw / 2);
  const cy = Math.round(size / 2 - ph / 2);

  // Left paddle — cyan #00e5ff
  fillRoundRect(gap, cy, pw, ph, rx, 0, 229, 255);
  // Right paddle — pink #ff4081
  fillRoundRect(size - gap - pw, cy, pw, ph, rx, 255, 64, 129);
  // Ball — white
  fillCircle(Math.round(size/2), Math.round(size/2), Math.round(size * 0.08), 255, 255, 255);

  return encodePNG(size, size, pixels);
}

// ── Draw preview ─────────────────────────────────────────────────────────────
function drawPreview() {
  const W = 1200, H = 630;
  const pixels = new Uint8Array(W * H * 4);

  function fillRect(x, y, w, h, r, g, b) {
    for (let py = y; py < Math.min(y+h, H); py++)
      for (let px = x; px < Math.min(x+w, W); px++) {
        const i = (py*W+px)*4;
        pixels[i]=r; pixels[i+1]=g; pixels[i+2]=b; pixels[i+3]=255;
      }
  }

  // Background
  fillRect(0, 0, W, H, 10, 10, 15);

  // Draw paddles as decorative elements
  const pw = 18, ph = 120, gap = 80;
  for (let y = H/2-ph/2; y < H/2+ph/2; y++) {
    for (let x = gap; x < gap+pw; x++) { const i=(Math.round(y)*W+Math.round(x))*4; pixels[i]=0;pixels[i+1]=229;pixels[i+2]=255;pixels[i+3]=255; }
    for (let x = W-gap-pw; x < W-gap; x++) { const i=(Math.round(y)*W+Math.round(x))*4; pixels[i]=255;pixels[i+1]=64;pixels[i+2]=129;pixels[i+3]=255; }
  }
  // Ball
  const bcx=W/2, bcy=H/2, br=14;
  for (let py=bcy-br; py<=bcy+br; py++)
    for (let px=bcx-br; px<=bcx+br; px++)
      if ((px-bcx)**2+(py-bcy)**2<=br**2) { const i=(Math.round(py)*W+Math.round(px))*4; pixels[i]=255;pixels[i+1]=255;pixels[i+2]=255;pixels[i+3]=255; }

  return encodePNG(W, H, pixels);
}

// ── Write files ───────────────────────────────────────────────────────────────
const outDir = path.join(__dirname, "../public/icons");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, "icon-192.png"), drawIcon(192));
console.log("icon-192.png ✓");
fs.writeFileSync(path.join(outDir, "icon-512.png"), drawIcon(512));
console.log("icon-512.png ✓");
fs.writeFileSync(path.join(__dirname, "../public/preview.png"), drawPreview());
console.log("preview.png ✓");
