import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal pure Node PNG generator without external dependencies
function createPNG(width, height, pixelFn) {
  // RGBA buffer: (width * 4 + 1) * height (1 filter byte per scanline)
  const rowBytes = width * 4 + 1;
  const rawData = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowBytes;
    rawData[rowStart] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const px = rowStart + 1 + x * 4;
      rawData[px] = r;
      rawData[px + 1] = g;
      rawData[px + 2] = b;
      rawData[px + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // Helper for CRC32
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);

    const typeAndData = Buffer.concat([typeBuf, data]);
    const crcVal = crc32(typeAndData);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);

    return Buffer.concat([lenBuf, typeAndData, crcBuf]);
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type 6 (RGBA)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw Islamic Crescent, Beads, and Star
function islamicPixel(x, y, w, h, isMaskable = false) {
  // Normalize coords to -1 .. 1
  const scale = isMaskable ? 0.72 : 0.88;
  const cx = w / 2;
  const cy = h / 2;
  const radius = (Math.min(w, h) / 2) * scale;

  const dx = (x - cx) / radius;
  const dy = (y - cy) / radius;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background: Deep emerald & rich dark slate radial
  const bgGrad = Math.min(1, Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / (w * 0.7));
  let r = Math.round(6 + (16 - 6) * bgGrad);
  let g = Math.round(44 + (24 - 44) * bgGrad);
  let b = Math.round(35 + (28 - 35) * bgGrad);
  let a = 255;

  // Outer circular glow border
  if (!isMaskable) {
    const cornerDist = Math.max(Math.abs(x - cx) / (w / 2), Math.abs(y - cy) / (h / 2));
    // Squircle smooth corner if needed or keep full bleed
  }

  // Crescent Moon: intersection of two circles
  // Circle 1: centered at (-0.05, 0), radius 0.58
  // Circle 2: centered at (0.22, -0.12), radius 0.52
  const c1Dist = Math.hypot(dx - (-0.05), dy - 0.0);
  const c2Dist = Math.hypot(dx - 0.22, dy - (-0.12));

  const inCrescent = c1Dist <= 0.58 && c2Dist >= 0.50;

  // Star: 8-point geometric star at (0.28, -0.22)
  const sx = dx - 0.28;
  const sy = dy - (-0.22);
  const sDist = Math.hypot(sx, sy);
  const angle = Math.atan2(sy, sx);
  // 8-point modulation
  const starRadius = 0.22 * (0.65 + 0.35 * Math.abs(Math.cos(angle * 4)));
  const inStar = sDist <= starRadius;

  // Beads arch surrounding bottom: 7 subtle beads along a lower arc
  let inBead = false;
  const beadCount = 9;
  for (let i = 0; i < beadCount; i++) {
    const t = (i / (beadCount - 1)) * Math.PI * 0.8 + Math.PI * 0.1;
    const bx = Math.cos(t) * 0.76;
    const by = Math.sin(t) * 0.76 + 0.05;
    if (Math.hypot(dx - bx, dy - by) <= 0.055) {
      inBead = true;
      break;
    }
  }

  if (inCrescent || inStar) {
    // Elegant warm gold / emerald highlight
    const goldGrad = (dy + 1) / 2;
    r = Math.round(245 - 20 * goldGrad);
    g = Math.round(195 - 35 * goldGrad);
    b = Math.round(85 + 20 * goldGrad);
  } else if (inBead) {
    // Emerald pearl beads
    r = 52;
    g = 211;
    b = 153;
  } else if (dist < 0.85 && dist > 0.82) {
    // Subtle decorative concentric gold ring
    r = 180;
    g = 150;
    b = 80;
  }

  return [r, g, b, a];
}

const publicDir = path.resolve('/public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate icon.svg
const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="60%" stop-color="#022c22" />
      <stop offset="100%" stop-color="#0c0a09" />
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect width="512" height="512" rx="100" fill="url(#bg)" />
  <circle cx="256" cy="256" r="210" fill="none" stroke="#eab308" stroke-width="2" stroke-opacity="0.3" stroke-dasharray="8 6" />

  <!-- Crescent -->
  <path d="M 280 130 A 130 130 0 1 0 350 360 A 110 110 0 1 1 280 130 Z" fill="url(#gold)" filter="url(#glow)" />

  <!-- 8-Pointed Star -->
  <polygon points="340,165 352,192 380,192 358,208 366,235 340,220 314,235 322,208 300,192 328,192" fill="url(#gold)" />

  <!-- Tasbih Beads Ring at Bottom -->
  <g fill="#34d399">
    <circle cx="160" cy="400" r="10" />
    <circle cx="195" cy="418" r="10" />
    <circle cx="235" cy="425" r="10" />
    <circle cx="277" cy="425" r="10" />
    <circle cx="317" cy="418" r="10" />
    <circle cx="352" cy="400" r="10" />
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');

// 2. Generate PNGs
console.log('Generating pwa-192x192.png...');
const png192 = createPNG(192, 192, (x, y, w, h) => islamicPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

console.log('Generating apple-touch-icon.png (180x180)...');
const appleIcon = createPNG(180, 180, (x, y, w, h) => islamicPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);

console.log('Generating pwa-512x512.png...');
const png512 = createPNG(512, 512, (x, y, w, h) => islamicPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

console.log('Generating pwa-maskable-512x512.png...');
const pngMaskable = createPNG(512, 512, (x, y, w, h) => islamicPixel(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable);

console.log('All icons generated successfully!');
