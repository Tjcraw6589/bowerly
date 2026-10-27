// Generates every image asset the app and stores need from one vector design:
// app icon, Android adaptive icon layers, splash images (light/dark), notification icon, favicon.
// Run: npm run assets
import { Buffer } from 'node:buffer';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'assets');
mkdirSync(out, { recursive: true });

const PRIMARY = '#1F7A5C';
const PRIMARY_DARK = '#155C45';
const LIGHT_BG = '#F6F5F0';
const DARK_BG = '#0F1613';

/**
 * The Bowerly mark: a bill (receipt card) sitting in a nest (bowl), drawn inside a
 * 1000x1000 box.
 *  - fg: colour of the nest and the bill outline/lines
 *  - billFill: fill of the bill (usually the background colour, for contrast)
 *  - scale: shrinks the mark toward the centre (adaptive icons need the inner 66%)
 *  - mono: single-colour variant (Android themed icon, notification icon)
 */
function mark(fg, billFill, scale = 1, mono = false) {
  const bill = mono
    ? `<rect x="365" y="215" width="270" height="340" rx="42" fill="none" stroke="${fg}" stroke-width="30"/>`
    : `<rect x="365" y="215" width="270" height="340" rx="42" fill="${billFill}" stroke="${fg}" stroke-width="26"/>`;
  const lines = [300, 370, 440]
    .map((y, i) => `<line x1="420" y1="${y}" x2="${i === 2 ? 530 : 580}" y2="${y}" stroke="${fg}" stroke-width="26" stroke-linecap="round"/>`)
    .join('');
  const nest = `<path d="M 150 520 A 350 350 0 0 0 850 520 Z" fill="${fg}"/>`;
  const weave = mono
    ? ''
    : `<path d="M 215 600 Q 500 760 785 600" fill="none" stroke="${billFill}" stroke-width="20" stroke-linecap="round" opacity="0.55"/>
       <path d="M 290 690 Q 500 790 710 690" fill="none" stroke="${billFill}" stroke-width="20" stroke-linecap="round" opacity="0.55"/>`;
  const body = `<g transform="rotate(-7 500 430)">${bill}${lines}</g>${nest}${weave}`;
  return `<g transform="translate(500 500) scale(${scale}) translate(-500 -500)">${body}</g>`;
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
await render('icon.png', 1024, `${gradientDefs}<rect width="1000" height="1000" fill="url(#g)"/>${mark('#FFFFFF', PRIMARY)}`);

// 2. Android adaptive icon layers. Foreground content stays inside the central safe zone.
await render('android-icon-foreground.png', 1024, mark('#FFFFFF', PRIMARY, 0.62));
await render('android-icon-background.png', 1024, `${gradientDefs}<rect width="1000" height="1000" fill="url(#g)"/>`);
await render('android-icon-monochrome.png', 1024, mark('#FFFFFF', '#000000', 0.62, true));

// 3. Splash images: transparent, mark only; the plugin places them on the configured background.
await render('splash-icon.png', 1024, mark(PRIMARY, LIGHT_BG, 0.9));
await render('splash-icon-dark.png', 1024, mark('#4CC39A', DARK_BG, 0.9));

// 4. Android notification icon: white on transparent, 96x96.
await render('notification-icon.png', 96, mark('#FFFFFF', '#000000', 1.1, true));

// 5. Favicon for the web preview.
await render('favicon.png', 64, `${gradientDefs}<rect width="1000" height="1000" rx="180" fill="url(#g)"/>${mark('#FFFFFF', PRIMARY, 1.05)}`);

// 6. Store-listing feature graphic source (Google Play wants 1024x500).
const feature = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  ${gradientDefs}
  <rect width="1024" height="500" fill="url(#g)"/>
  <g transform="translate(90,70) scale(0.36)">${mark('#FFFFFF', PRIMARY)}</g>
  <text x="470" y="215" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="92" font-weight="800" fill="#FFFFFF" letter-spacing="-2">Bowerly</text>
  <text x="472" y="285" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="38" font-weight="500" fill="#DCF0E6">Every bill, one place.</text>
  <text x="472" y="345" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="28" fill="#BFE3D2">Private · Offline · No account · One-time Pro</text>
</svg>`;
mkdirSync(join(root, 'store'), { recursive: true });
await sharp(Buffer.from(feature)).png().toFile(join(root, 'store', 'feature-graphic.png'));
console.log('wrote store/feature-graphic.png (1024x500)');

export { LIGHT_BG, DARK_BG };
