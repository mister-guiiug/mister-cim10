#!/usr/bin/env node
/**
 * Generate PNG icons from SVG favicon
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const publicDir = join(rootDir, 'public');

// Read SVG
const svgBuffer = readFileSync(join(publicDir, 'favicon.svg'));

// Icon sizes to generate
const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 96, name: 'favicon-96.png' },
  { size: 144, name: 'icon-144.png' },
  { size: 256, name: 'icon-256.png' },
  { size: 384, name: 'icon-384.png' },
];

// Maskable icon (with safe zone)
async function generateMaskable(size) {
  const safeZone = Math.floor(size * 0.875); // 87.5% safe zone for Android maskable

  // Create SVG with padding for maskable icon
  const maskableSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e3a5f"/>
          <stop offset="100%" style="stop-color:#0c1222"/>
        </linearGradient>
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#38bdf8"/>
          <stop offset="100%" style="stop-color:#0ea5e9"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#bgGrad)"/>
      <g transform="translate(${(size - safeZone) / 2}, ${(size - safeZone) / 2})">
        <g fill="url(#accentGrad)">
          <rect x="${safeZone * 0.406}" y="${safeZone * 0.219}" width="${safeZone * 0.1875}" height="${safeZone * 0.5625}" rx="${safeZone * 0.031}"/>
          <rect x="${safeZone * 0.219}" y="${safeZone * 0.406}" width="${safeZone * 0.5625}" height="${safeZone * 0.1875}" rx="${safeZone * 0.031}"/>
        </g>
        <g fill="#38bdf8" opacity="0.9">
          <circle cx="${safeZone * 0.75}" cy="${safeZone * 0.3125}" r="${safeZone * 0.0625}"/>
          <circle cx="${safeZone * 0.75}" cy="${safeZone * 0.6875}" r="${safeZone * 0.0625}"/>
        </g>
      </g>
      <rect x="0" y="0" width="${size}" height="${size}" fill="#ffffff" opacity="0.08" rx="${size * 0.22}"/>
    </svg>
  `;

  return Buffer.from(maskableSvg);
}

async function generateIcons() {
  console.log('🎨 Generating icons...');

  for (const { size, name } of sizes) {
    const outputPath = join(publicDir, name);

    // Resize SVG to target size
    await sharp(svgBuffer)
      .resize(size, size, {
        fit: 'cover',
        background: { r: 12, g: 18, b: 34, alpha: 1 }
      })
      .png()
      .toFile(outputPath);

    console.log(`  ✓ ${name} (${size}x${size})`);
  }

  // Generate maskable icon
  const maskableSize = 512;
  const maskableSvg = await generateMaskable(maskableSize);
  const maskablePath = join(publicDir, 'icon-maskable.png');

  await sharp(maskableSvg)
    .png()
    .toFile(maskablePath);

  console.log(`  ✓ icon-maskable.png (512x512, maskable)`);

  console.log('\n✨ Icons generated successfully!');
  console.log('\n📱 To update PWA on Android:');
  console.log('   1. Rebuild the app (npm run build)');
  console.log('   2. Deploy to GitHub Pages');
  console.log('   3. Clear site data in Chrome (chrome://site-data)');
  console.log('   4. Re-add to home screen from Chrome');
}

generateIcons().catch(console.error);
