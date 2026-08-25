/**
 * Renders each print template to a vector PDF (for the printer) and a high-res
 * PNG (for preview / the dashboard), using headless Chrome directly — no
 * puppeteer dependency.
 *
 * PDF uses Chrome's --print-to-pdf which honours the template's @page size, so
 * the physical dimensions are exact and text stays vector-crisp.
 *
 * PNG uses --screenshot with a forced device scale factor for ~300 DPI raster,
 * for pieces where a printer wants a bitmap or for on-screen previews.
 *
 * Output: brand/dist/print-templates/{pdf,png}/
 *
 * Usage: node scripts/render-print-templates.js
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');
const TPL = path.join(REPO, 'brand', 'templates');
const OUT = path.join(REPO, 'brand', 'dist', 'print-templates');
const PDF_DIR = path.join(OUT, 'pdf');
const PNG_DIR = path.join(OUT, 'png');
const WEB_PREVIEW = path.join(REPO, 'apps', 'web', 'public', 'brand', 'print');

for (const d of [PDF_DIR, PNG_DIR, WEB_PREVIEW]) fs.mkdirSync(d, { recursive: true });

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];
const CHROME = process.env.CHROME_PATH || CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!CHROME) {
  console.error('No Chrome/Edge found. Set CHROME_PATH to a chrome.exe.');
  process.exit(1);
}
console.log('Using browser:', CHROME);

// CSS px per inch is 96; the on-screen/screenshot pixels = inches * 96 * scale.
// scale 3.125 -> 300 DPI.
const PX = 96;
const SCALE = 3.125;

// width/height in inches drive the PNG window size. PDF ignores these (uses @page).
const items = [
  { file: 'visiting-card-front.html', w: 3.75, h: 2.25 },
  { file: 'visiting-card-back.html', w: 3.75, h: 2.25 },
  { file: 'brochure-cover.html', w: 8.27, h: 11.69 },
  { file: 'brochure-inside.html', w: 8.27, h: 11.69 },
  { file: 'flex-portrait.html', w: 4, h: 6 },
  { file: 'flex-hoarding.html', w: 12, h: 6 },
  { file: 'carry-bag.html', w: 12, h: 15 },
  { file: 'letterhead.html', w: 8.27, h: 11.69 },
];

function fileUrl(p) {
  return 'file:///' + p.replace(/\\/g, '/');
}

function run(args) {
  execFileSync(CHROME, args, { stdio: 'ignore', timeout: 120000 });
}

const baseArgs = [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  '--force-color-profile=srgb',
  '--run-all-compositor-stages-before-draw',
  '--virtual-time-budget=6000', // let fonts + images load before capture
];

for (const it of items) {
  const src = fileUrl(path.join(TPL, it.file));
  const base = it.file.replace(/\.html$/, '');

  // PDF (vector, exact @page size) — best for the printer.
  const pdf = path.join(PDF_DIR, `${base}.pdf`);
  run([...baseArgs, `--print-to-pdf=${pdf}`, '--no-pdf-header-footer', src]);

  // PNG (high-res raster) — for preview + printers that want a bitmap.
  const png = path.join(PNG_DIR, `${base}.png`);
  const wPx = Math.round(it.w * PX);
  const hPx = Math.round(it.h * PX);
  run([
    ...baseArgs,
    `--force-device-scale-factor=${SCALE}`,
    `--window-size=${wPx},${hPx}`,
    `--screenshot=${png}`,
    src,
  ]);

  const pdfKb = fs.existsSync(pdf) ? Math.round(fs.statSync(pdf).size / 1024) : 0;
  const pngKb = fs.existsSync(png) ? Math.round(fs.statSync(png).size / 1024) : 0;
  console.log(`${base.padEnd(24)} pdf=${pdfKb}KB  png=${pngKb}KB (${Math.round(wPx*SCALE)}x${Math.round(hPx*SCALE)})`);

  // For the dashboard: serve the print-ready PDF directly, plus a small
  // downscaled preview thumbnail (keeps the web bundle lean vs the HD PNG).
  if (fs.existsSync(pdf)) fs.copyFileSync(pdf, path.join(WEB_PREVIEW, `${base}.pdf`));
  if (fs.existsSync(png)) {
    const preview = path.join(WEB_PREVIEW, `${base}.png`);
    try {
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-vf', 'scale=900:-1', preview], { stdio: 'ignore' });
    } catch {
      fs.copyFileSync(png, preview); // ffmpeg missing: fall back to full png
    }
  }
}

console.log('\nPDFs:', PDF_DIR);
console.log('PNGs:', PNG_DIR);
console.log('Web previews copied to apps/web/public/brand/print/');
