// Generates every image asset the app and stores need from one vector design:
// app icon, Android adaptive icon layers, splash images (light/dark), notification icon, favicon.
// Run: npm run assets
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'assets');
mkdirSync(out, { recursive: true });

const PRIMARY = '#3D5AFE';
const PRIMARY_DARK = '#2A3FD6';
const LIGHT_BG = '#F6F7FB';
const DARK_BG = '#0F1222';

/**
 * The mark: four tally strokes and a diagonal "fifth" stroke, drawn inside a
 * 1000x1000 box. `color` is the stroke colour; `scale` shrinks the mark
 * toward the centre (adaptive icons need everything inside the inner 66%).
 */
function mark(color, scale = 1, strokeWidth = 86) {
  const cx = 500;
  const cy = 500;
  const half = 290 * scale;
  const xs = [-210, -70, 70, 210].map((x) => cx + x * scale);
  const sw = strokeWidth * scale;
  const bars = xs
    .map((x) => `<line x1="${x}" y1="${cy - half}" x2="${x}" y2="${cy + half}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`)
    .join('');
  const diag = `<line x1="${cx - 330 * scale}" y1="${cy + 230 * scale}" x2="${cx + 330 * scale}" y2="${cy - 230 * scale}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
  return bars + diag;
}

function svg(size, body, background = 'none') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1000 1000">
  ${background === 'none' ? '' : `<rect width="1000" height="1000" fill="${background}"/>`}
  ${body}
</svg>`;
}

const gradientDefs = `<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${PRIMARY}"/>
    <stop offset="1" stop-color="${PRIMARY_DARK}"/>
  </linearGradient>
</defs>`;

async function render(name, size, body, background = 'none') {
  const file = join(out, name);
  await sharp(Buffer.from(svg(size, body, background))).resize(size, size).png({ compressionLevel: 9 }).toFile(file);
  console.log(`wrote assets/${name} (${size}x${size})`);
}

// 1. App icon: opaque, square; the stores round the corners themselves.
await render('icon.png', 1024, `${gradientDefs}<rect width="1000" height="1000" fill="url(#g)"/>${mark('#FFFFFF')}`);

// 2. Android adaptive icon layers. Foreground content stays inside the central safe zone.
await render('android-icon-foreground.png', 1024, mark('#FFFFFF', 0.62));
await render('android-icon-background.png', 1024, `${gradientDefs}<rect width="1000" height="1000" fill="url(#g)"/>`);
await render('android-icon-monochrome.png', 1024, mark('#FFFFFF', 0.62));

// 3. Splash images: transparent, mark only; the plugin places them on the configured background.
await render('splash-icon.png', 1024, mark(PRIMARY, 0.9, 80));
await render('splash-icon-dark.png', 1024, mark('#8396FF', 0.9, 80));

// 4. Android notification icon: white on transparent, 96x96.
await render('notification-icon.png', 96, mark('#FFFFFF', 1, 110));

// 5. Favicon for the web preview.
await render('favicon.png', 64, `${gradientDefs}<rect width="1000" height="1000" rx="180" fill="url(#g)"/>${mark('#FFFFFF', 1, 110)}`);

// 6. Store-listing feature graphic source (Google Play wants 1024x500).
const feature = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  ${gradientDefs}
  <rect width="1024" height="500" fill="url(#g)"/>
  <g transform="translate(90,70) scale(0.36)">${mark('#FFFFFF')}</g>
  <text x="470" y="215" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="92" font-weight="800" fill="#FFFFFF" letter-spacing="-2">Billnest</text>
  <text x="472" y="285" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="38" font-weight="500" fill="#E6EAFF">Every subscription, one tally.</text>
  <text x="472" y="345" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="28" fill="#C7CEFF">Private · Offline · No account · One-time Pro</text>
</svg>`;
mkdirSync(join(root, 'store'), { recursive: true });
await sharp(Buffer.from(feature)).png().toFile(join(root, 'store', 'feature-graphic.png'));
console.log('wrote store/feature-graphic.png (1024x500)');

export { LIGHT_BG, DARK_BG };
