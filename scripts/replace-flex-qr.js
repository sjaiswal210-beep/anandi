/**
 * Replaces the decorative QR on the final Anandi Park flex with a REAL scannable
 * WhatsApp QR: opens wa.me/917558444117 with prefilled "Hi, Information pathva".
 *
 * Detection: the old QR is found by dark-pixel density per row/column inside a
 * search window (a QR reads ~40-60% dark). The white panel around it is then
 * the QR bounds plus its white margin. Only that panel is repainted, so the
 * Marathi text beside it ("स्कॅन करा आणि...") is untouched.
 *
 * Usage: node scripts/replace-flex-qr.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const QRCode = require('qrcode');

const REPO = path.join(__dirname, '..');
const SRC = path.join(REPO, 'brand', 'dist', 'flex-final', 'flex-source.png');
const OUT_PNG = path.join(REPO, 'brand', 'dist', 'flex-final', 'anandi-park-flex-40x40-final.png');
const OUT_PDF = path.join(REPO, 'brand', 'dist', 'flex-final', 'anandi-park-flex-40x40-final.pdf');

const WA_URL = 'https://wa.me/917558444117?text=' + encodeURIComponent('Hi, Information pathva');

const W = 1254, H = 1254;

function ff(args) { execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' }); }

// ── read raw pixels ──
const rawFile = path.join(os.tmpdir(), 'flexraw.raw');
ff(['-i', SRC, '-f', 'rawvideo', '-pix_fmt', 'rgb24', rawFile]);
const raw = fs.readFileSync(rawFile);
fs.unlinkSync(rawFile);

// The flex background is dark navy, so the QR is located by its WHITE modules,
// which stand out. The Marathi text right of the QR is also white, so the
// search window stops before it (text starts ~x 940).
const isWhite = (x, y) => {
  const i = (y * W + x) * 3;
  return raw[i] > 200 && raw[i + 1] > 200 && raw[i + 2] > 200;
};

// y capped at 800: the full-width white feature band starts at y=810 and would
// otherwise contaminate the row detection.
const wx0 = 720, wx1 = 940, wy0 = 590, wy1 = 800;

const colDensity = [];
for (let x = wx0; x < wx1; x++) {
  let d = 0;
  for (let y = wy0; y < wy1; y++) if (isWhite(x, y)) d++;
  colDensity[x] = d / (wy1 - wy0);
}
const rowDensity = [];
for (let y = wy0; y < wy1; y++) {
  let d = 0;
  for (let x = wx0; x < wx1; x++) if (isWhite(x, y)) d++;
  rowDensity[y] = d / (wx1 - wx0);
}

function bounds(density, from, to, threshold) {
  let lo = -1, hi = -1;
  for (let i = from; i < to; i++) {
    if (density[i] > threshold) { if (lo < 0) lo = i; hi = i; }
  }
  return [lo, hi];
}

const [qrX0, qrX1] = bounds(colDensity, wx0, wx1, 0.18);
const [qrY0, qrY1] = bounds(rowDensity, wy0, wy1, 0.18);
console.log(`QR modules detected: x ${qrX0}-${qrX1}, y ${qrY0}-${qrY1} (${qrX1 - qrX0}x${qrY1 - qrY0})`);

if (qrX1 - qrX0 < 90 || qrY1 - qrY0 < 90 || qrX1 - qrX0 > 260 || qrY1 - qrY0 > 260) {
  console.error('QR detection outside plausible size. Aborting rather than guessing.');
  process.exit(1);
}
// A QR is square; if the detected box is far from square, something else got
// swept in (band, text) and repainting would damage the design.
if (Math.abs((qrX1 - qrX0) - (qrY1 - qrY0)) > 30) {
  console.error('Detected box is not square — refusing to repaint. Adjust the window.');
  process.exit(1);
}

// The white panel = QR + its white margin. Use a conservative margin so we stay
// inside the panel and never touch the surrounding design/text.
const margin = 8;
const px0 = qrX0 - margin, py0 = qrY0 - margin;
const pw = (qrX1 - qrX0 + 1) + margin * 2;
const ph = (qrY1 - qrY0 + 1) + margin * 2;

// New QR fills the same box as the old modules (crisper: slightly larger, still inside panel).
const qrSize = Math.min(qrX1 - qrX0, qrY1 - qrY0) + 2;
const qx = px0 + Math.round((pw - qrSize) / 2);
const qy = py0 + Math.round((ph - qrSize) / 2);

const qrFile = path.join(os.tmpdir(), 'waqr.png');

QRCode.toFile(qrFile, WA_URL, {
  errorCorrectionLevel: 'M',
  width: qrSize * 6, // oversample for crisp downscale
  margin: 0,
  color: { dark: '#0b1020', light: '#ffffff' },
}).then(() => {
  ff([
    '-i', SRC, '-i', qrFile,
    '-filter_complex',
    `[0:v]drawbox=x=${px0}:y=${py0}:w=${pw}:h=${ph}:color=white:t=fill[bg];` +
    `[1:v]scale=${qrSize}:${qrSize}:flags=neighbor[qr];` +
    `[bg][qr]overlay=${qx}:${qy}`,
    '-frames:v', '1', OUT_PNG,
  ]);
  console.log(`final PNG: ${OUT_PNG}`);

  // Wrap in a 40in x 40in PDF (printer scales 1in -> 1ft).
  const html = path.join(os.tmpdir(), 'flexwrap.html');
  fs.writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8">
<style>@page{size:40in 40in;margin:0}*{margin:0;padding:0}
img{width:40in;height:40in;display:block;object-fit:fill}</style></head>
<body><img src="file:///${OUT_PNG.replace(/\\/g, '/')}"></body></html>`);

  const CHROME = process.env.CHROME_PATH || [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].find((p) => fs.existsSync(p));

  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--run-all-compositor-stages-before-draw', '--virtual-time-budget=5000',
    `--print-to-pdf=${OUT_PDF}`, '--no-pdf-header-footer',
    'file:///' + html.replace(/\\/g, '/')], { stdio: 'ignore', timeout: 120000 });
  console.log(`final PDF: ${OUT_PDF}`);
  console.log(`\nQR encodes: ${WA_URL}`);
}).catch((e) => { console.error('QR generation failed:', e.message); process.exit(1); });
