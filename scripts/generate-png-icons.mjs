import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writePNG(width, height, isMaskable = false) {
  const rowBytes = width * 4;
  const rawData = Buffer.alloc((rowBytes + 1) * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.45;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowBytes + 1);
    rawData[rowOffset] = 0; // Filter type 0: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background color: #0c0e12
      let r = 12, g = 14, b = 18, a = 255;

      // Outer border circle
      if (dist >= radius - 3 && dist <= radius + 1) {
        // Gold border
        r = 217; g = 119; b = 6;
      } else if (dist < radius - 3) {
        // Inner subtle gradient
        const t = 1 - (dist / radius);
        r = Math.min(255, Math.floor(12 + t * 45));
        g = Math.min(255, Math.floor(14 + t * 25));
        b = Math.min(255, Math.floor(18 + t * 5));

        // Center amber glow
        if (dist < radius * 0.5) {
          r = Math.min(255, r + 50);
          g = Math.min(255, g + 30);
        }

        // Draw letter "Z" / "ز" shape
        // Dot at top-center-right
        const dotDx = x - (cx + width * 0.08);
        const dotDy = y - (cy - height * 0.22);
        if (dotDx * dotDx + dotDy * dotDy < (width * 0.045) * (width * 0.045)) {
          r = 254; g = 240; b = 138; // Pale gold
        }

        // Swoosh curve for "ر" / "ز"
        const relX = (x - cx) / width;
        const relY = (y - cy) / height;
        if (relY >= -0.15 && relY <= 0.25) {
          // Parabolic curve: relX approx 0.15 - 0.7 * (relY + 0.15)^1.5
          const targetX = 0.12 - 0.8 * Math.pow(Math.max(0, relY + 0.15), 1.4);
          if (Math.abs(relX - targetX) < 0.045) {
            r = 245; g = 158; b = 11; // Amber
          }
        }
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // Deflate
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  typeBuf.copy(chunk, 4);
  data.copy(chunk, 8);
  const crcTarget = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcTarget);
  chunk.writeUInt32BE(crcVal, 8 + len);
  return chunk;
}

const pubDir = path.resolve('public');
if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), writePNG(192, 192, false));
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), writePNG(512, 512, false));
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), writePNG(512, 512, true));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), writePNG(180, 180, false));
fs.writeFileSync(path.join(pubDir, 'favicon.ico'), writePNG(64, 64, false));

console.log('PWA PNG assets created successfully in public/');
