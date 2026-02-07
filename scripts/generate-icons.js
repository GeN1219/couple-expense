// Generate PNG icons from SVG using Canvas API
// Run: node scripts/generate-icons.js
// Requires: npm install canvas (only for build step)

import { readFileSync, writeFileSync } from 'fs';
import { createCanvas, loadImage } from 'canvas';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

async function generateIcons() {
  const svgBuffer = readFileSync(join(publicDir, 'icon-512.svg'));
  const svgDataUrl = `data:image/svg+xml;base64,${svgBuffer.toString('base64')}`;
  const img = await loadImage(svgDataUrl);

  for (const size of [512, 192]) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    writeFileSync(join(publicDir, `icon-${size}.png`), canvas.toBuffer('image/png'));
    console.log(`Generated icon-${size}.png`);
  }

  // Maskable icon (512 with extra padding for safe zone)
  const mCanvas = createCanvas(512, 512);
  const mCtx = mCanvas.getContext('2d');
  mCtx.fillStyle = '#E8D7C3';
  mCtx.fillRect(0, 0, 512, 512);
  // Draw at 80% in center for maskable safe area
  const inset = 512 * 0.1;
  const drawSize = 512 * 0.8;
  mCtx.drawImage(img, inset, inset, drawSize, drawSize);
  writeFileSync(join(publicDir, 'icon-maskable-512.png'), mCanvas.toBuffer('image/png'));
  console.log('Generated icon-maskable-512.png');
}

generateIcons().catch(console.error);
