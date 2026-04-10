/**
 * Génère des icônes PNG PWA (fond #0284c7) à partir de pngjs.
 * Exécuter : node scripts/generate-icons.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

function solidPng(size, r, g, b) {
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (size * y + x) << 2;
      png.data[i] = r;
      png.data[i + 1] = g;
      png.data[i + 2] = b;
      png.data[i + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

const r = 0x02;
const g = 0x84;
const b = 0xc7;

for (const size of [192, 512]) {
  const buf = solidPng(size, r, g, b);
  const out = path.join(publicDir, `icon-${size}.png`);
  fs.writeFileSync(out, buf);
  console.log('wrote', out);
}
