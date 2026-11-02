/**
 * Renders every brand asset from the cat artwork in src/components/cat.
 *
 *   npm run brand
 *
 * Writes: assets/icon.png, favicon.png, splash-icon.png, android-icon-*.png,
 * assets/brand/*, and the web app icons in public/. Edit the art (luckyCatArt.ts)
 * or colours (palette.ts), then re-run.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { ICON_GRADIENT } from '../src/components/cat/palette';
import { LUCKY_CAT_MARKUP, LUCKY_CAT_SVG, LUCKY_CAT_VIEWBOX } from '../src/components/cat/luckyCatArt';

const ASSETS = join(__dirname, '..', 'assets');
const BRAND = join(ASSETS, 'brand');
const PUBLIC = join(__dirname, '..', 'public'); // served as-is by the web build
mkdirSync(BRAND, { recursive: true });
mkdirSync(PUBLIC, { recursive: true });

const [from, to] = ICON_GRADIENT;
const gradient = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>`;

const canvas = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${body}</svg>`;

/** Put the cat on a 1024 canvas, `width` px wide, nudged down by `dy`. */
function placeCat(width: number, dy = 0) {
  const { width: vw } = LUCKY_CAT_VIEWBOX;
  const s = width / vw;
  // The artwork is centred on x = 120, y = 146 in its own coordinates.
  return `<g transform="translate(${512 - 120 * s} ${512 - 146 * s + dy}) scale(${s})">${LUCKY_CAT_MARKUP}</g>`;
}

const icon = canvas(`${gradient}<rect width="1024" height="1024" fill="url(#bg)"/>${placeCat(760, 8)}`);
const logo = canvas(
  `${gradient}<rect x="64" y="64" width="896" height="896" rx="208" fill="url(#bg)"/>${placeCat(700, 8)}`,
);
const adaptiveForeground = canvas(placeCat(470, 4));
const adaptiveBackground = canvas(`${gradient}<rect width="1024" height="1024" fill="url(#bg)"/>`);
// Maskable web icon: full-bleed, with the cat kept inside the central 80% "safe zone".
const maskable = canvas(`${gradient}<rect width="1024" height="1024" fill="url(#bg)"/>${placeCat(560, 6)}`);

const render = (svg: string, size = 1024) => sharp(Buffer.from(svg), { density: 300 }).resize(size, size);

async function monochrome(svg: string, out: string) {
  // Android themed icons use only the alpha channel. Keep light fills as opaque white
  // and punch the dark outline and features out, so the face stays readable when tinted.
  const { data, info } = await render(svg).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255;
    const luma = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    const keep = Math.min(1, Math.max(0, (luma - 0.3) / 0.2));
    data[i] = data[i + 1] = data[i + 2] = 255;
    data[i + 3] = Math.round(255 * alpha * keep);
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(out);
}

async function main() {
  writeFileSync(join(BRAND, 'lucky-cat.svg'), LUCKY_CAT_SVG);
  writeFileSync(join(BRAND, 'icon.svg'), icon);
  writeFileSync(join(BRAND, 'logo.svg'), logo);

  await Promise.all([
    render(icon).png().toFile(join(ASSETS, 'icon.png')),
    render(icon, 48).png().toFile(join(ASSETS, 'favicon.png')),
    render(logo).png().toFile(join(BRAND, 'logo.png')),
    render(adaptiveForeground).png().toFile(join(ASSETS, 'android-icon-foreground.png')),
    render(adaptiveBackground).png().toFile(join(ASSETS, 'android-icon-background.png')),
    monochrome(adaptiveForeground, join(ASSETS, 'android-icon-monochrome.png')),
    // Web app (installed to the Home Screen from the browser).
    render(icon, 180).png().toFile(join(PUBLIC, 'apple-touch-icon.png')),
    render(icon, 192).png().toFile(join(PUBLIC, 'icon-192.png')),
    render(icon, 512).png().toFile(join(PUBLIC, 'icon-512.png')),
    render(maskable, 512).png().toFile(join(PUBLIC, 'icon-maskable-512.png')),
    render(icon, 64).png().toFile(join(PUBLIC, 'favicon.png')),
    // Splash: the cat alone, transparent, at the artwork's own aspect ratio.
    sharp(Buffer.from(LUCKY_CAT_SVG), { density: 216 })
      .resize(1080, 1160)
      .png()
      .toFile(join(ASSETS, 'splash-icon.png')),
  ]);
  console.log('Brand assets written to assets/ and public/');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
