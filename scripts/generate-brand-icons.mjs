import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="goldG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde68a" />
      <stop offset="45%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="bgG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1329" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#f59e0b" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Background rounded card -->
  <rect width="100" height="100" rx="22" fill="url(#bgG)" stroke="#1e293b" stroke-width="1.5" />
  <rect width="100" height="100" rx="22" fill="none" stroke="#f59e0b" stroke-opacity="0.18" stroke-width="1.5" />

  <!-- Document Outline with Folded Bottom-Right Corner -->
  <path d="M 24 22 C 24 17 27 14 32 14 H 68 C 73 14 76 17 76 22 V 62 L 62 76 H 32 C 27 76 24 73 24 68 Z" 
        fill="#0c162d" 
        stroke="url(#goldG)" 
        stroke-width="4" 
        stroke-linejoin="round" />

  <!-- Folded Dog-Ear Flap -->
  <path d="M 62 62 H 76 L 62 76 Z" 
        fill="#1e293b" 
        stroke="url(#goldG)" 
        stroke-width="4" 
        stroke-linejoin="round" />

  <!-- Horizontal Document Line -->
  <line x1="34" y1="67" x2="54" y2="67" stroke="url(#goldG)" stroke-width="4" stroke-linecap="round" />

  <!-- Golden Padlock Shackle -->
  <path d="M 41 38 V 26 C 41 21 45 17 50 17 C 55 17 59 21 59 26 V 38" 
        fill="none" 
        stroke="url(#goldG)" 
        stroke-width="5.5" 
        stroke-linecap="round" />

  <!-- Padlock Body -->
  <rect x="33" y="37" width="34" height="26" rx="6" 
        fill="url(#goldG)" 
        stroke="#fef3c7" 
        stroke-width="1" 
        filter="url(#goldGlow)" />

  <!-- Shield Shape inside Padlock Body -->
  <path d="M 50 43 L 58 45.8 V 51 C 58 55.5 54.5 58.5 50 60 C 45.5 58.5 42 55.5 42 51 V 45.8 Z" 
        fill="#080e1a" 
        stroke="#fde68a" 
        stroke-width="1.5" 
        stroke-linejoin="round" />

  <!-- Keyhole inside Shield -->
  <circle cx="50" cy="50" r="2.2" fill="url(#goldG)" />
  <polygon points="48.8,50 51.2,50 52,55.5 48,55.5" fill="url(#goldG)" />
</svg>
`;

async function main() {
  console.log('Rendering new BlindShare Gold Document-Padlock Shield icons...');

  // 1. Write the master SVG to public/brand/02-favicon.svg
  fs.writeFileSync('public/brand/02-favicon.svg', svg.trim());
  console.log('✓ Wrote public/brand/02-favicon.svg');

  // Also update 05-shield-lock-icon.svg and 10-app-icon-512.svg
  fs.writeFileSync('public/brand/05-shield-lock-icon.svg', svg.trim());
  fs.writeFileSync('public/brand/10-app-icon-512.svg', svg.trim());

  const svgBuffer = Buffer.from(svg.trim());

  // 2. Render 512x512 PNGs
  const png512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();
  fs.writeFileSync('src/app/icon.png', png512);
  fs.writeFileSync('public/brand/icon.png', png512);
  console.log('✓ Generated 512x512 PNG: src/app/icon.png & public/brand/icon.png');

  // 3. Render 180x180 Apple Touch Icon
  const png180 = await sharp(svgBuffer).resize(180, 180).png().toBuffer();
  fs.writeFileSync('src/app/apple-icon.png', png180);
  console.log('✓ Generated 180x180 PNG: src/app/apple-icon.png');

  // 4. Render 32x32 Favicon PNG
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync('public/favicon.png', png32);
  console.log('✓ Generated 32x32 PNG: public/favicon.png');

  console.log('All brand icons successfully overhauled with pixel-perfect resolution!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
