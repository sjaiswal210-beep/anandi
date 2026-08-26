/**
 * Renders the Marathi 40x40 ft flex to:
 *   - a high-res square PNG (4000x4000) for the printer / preview
 *   - a 40in x 40in vector PDF (printer scales 1in -> 1ft)
 * using headless Chrome. Also drops a downscaled preview into apps/web/public.
 *
 * Usage: node scripts/render-marathi-flex.js
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');
const SRC = path.join(REPO, 'brand', 'templates', 'flex-marathi-40x40.html');
const OUTDIR = path.join(REPO, 'brand', 'dist', 'print-templates');
const WEB = path.join(REPO, 'apps', 'web', 'public', 'brand', 'print');
for (const d of [path.join(OUTDIR, 'png'), path.join(OUTDIR, 'pdf'), WEB]) fs.mkdirSync(d, { recursive: true });

const CHROME = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('No Chrome found; set CHROME_PATH'); process.exit(1); }

const url = 'file:///' + SRC.replace(/\\/g, '/');
const base = ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--force-color-profile=srgb', '--run-all-compositor-stages-before-draw',
  '--virtual-time-budget=8000'];

const png = path.join(OUTDIR, 'png', 'flex-marathi-40x40.png');
const pdf = path.join(OUTDIR, 'pdf', 'flex-marathi-40x40.pdf');

// PNG: 2000x2000 window at 2x scale = 4000x4000.
execFileSync(CHROME, [...base, '--force-device-scale-factor=2', '--window-size=2000,2000',
  `--screenshot=${png}`, url], { stdio: 'ignore', timeout: 180000 });
// PDF: honours the @page 40in x 40in size.
execFileSync(CHROME, [...base, `--print-to-pdf=${pdf}`, '--no-pdf-header-footer', url],
  { stdio: 'ignore', timeout: 180000 });

console.log('PNG:', png, fs.existsSync(png) ? `${Math.round(fs.statSync(png).size/1024)}KB` : 'MISSING');
console.log('PDF:', pdf, fs.existsSync(pdf) ? `${Math.round(fs.statSync(pdf).size/1024)}KB` : 'MISSING');

// Web preview (downscaled) so the dashboard can show it.
if (fs.existsSync(png)) {
  const preview = path.join(WEB, 'flex-marathi-40x40.png');
  try { execFileSync('ffmpeg', ['-v','error','-y','-i',png,'-vf','scale=1000:-1',preview], {stdio:'ignore'}); }
  catch { fs.copyFileSync(png, preview); }
  if (fs.existsSync(pdf)) fs.copyFileSync(pdf, path.join(WEB, 'flex-marathi-40x40.pdf'));
  console.log('Web preview + pdf copied to apps/web/public/brand/print/');
}
