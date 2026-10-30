// npm i -D sharp   →   node scripts/make-icons.mjs
import sharp from 'sharp';
const out = 'public/icons';
const jobs = [
  ['icon-any.svg', 'icon-192.png', 192],
  ['icon-any.svg', 'icon-512.png', 512],
  ['icon-maskable.svg', 'icon-maskable-192.png', 192],
  ['icon-maskable.svg', 'icon-maskable-512.png', 512],
  ['icon-any.svg', 'apple-touch-icon.png', 180],
  ['icon-any.svg', 'favicon-32.png', 32],
];
for (const [src, name, size] of jobs) {
  await sharp(`${out}/${src}`, { density: 384 }).resize(size, size).png().toFile(`${out}/${name}`);
}
