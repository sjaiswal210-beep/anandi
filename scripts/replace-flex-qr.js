/**
 * Final flex edits, all measured against the extracted artwork (1254x1254):
 *
 * 1. Real WhatsApp QR with a TIGHT white border, placed in the measured safe
 *    area (offer band corner ends x<=752/y<=612; Marathi text starts x~940;
 *    white feature band starts y~810; old QR spanned x762-925/y620-785):
 *      panel  x 758-936, y 616-798  ·  QR 168px, ~5-7px border
 * 2. Prefilled message: "Hi- Send more information"
 * 3. "+91 " removed from the second phone number by shifting the digits
 *    "75584 44117" (x813-1195) left to x690 and navy-filling the vacated strip.
 *    Phone line rows measured at y1084-1139 (crop band y1075-1150 with padding).
 *
 * Usage: node scripts/replace-flex-qr.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const QRCode = require('qrcode');

const REPO = path.join(__dirname, '..');
// brand/flex/ is committed (travels in the zip / git); brand/dist/ is gitignored.
const SRC = path.join(REPO, 'brand', 'flex', 'flex-source.png');
const OUT_PNG = path.join(REPO, 'brand', 'flex', 'anandi-park-flex-40x40-final.png');
const OUT_PDF = path.join(REPO, 'brand', 'flex', 'anandi-park-flex-40x40-final.pdf');

const WA_URL = 'https://wa.me/917558444117?text=' + encodeURIComponent('Hi- Send more information');

// ── QR section geometry (redesigned) ──
// The whole strip x754-1230 / y600-806 is cleared (old QR + the Marathi
// "स्कॅन करा आणि..." text + swoosh), then: big QR on the LEFT of the strip,
// "SCAN NOW" caption to its right. Photo graphics above y600 and the white
// feature band below y810 stay untouched.
const WIPE = { x: 754, y: 600, w: 1230 - 754, h: 806 - 600 };
const px0 = 758, py0 = 602, pw = 200, ph = 200;
const qrSize = 188;
const qx = px0 + Math.round((pw - qrSize) / 2);
const qy = py0 + Math.round((ph - qrSize) / 2);
const FONT = 'C\\:/Windows/Fonts/arialbd.ttf';

// ── phone-line edit geometry (measured) ──
const D = { x: 813, y: 1075, w: 382, h: 75 };  // "75584 44117" crop
const PASTE_X = 690;                            // digits' new left edge (over old "+91")
const FILL = { x: PASTE_X + D.w, y: 1075, w: 1200 - (PASTE_X + D.w), h: 75 }; // vacated strip
const NAVY = '0x071222'; // sampled band background RGB(7,18,34)

function ff(args) { execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' }); }

const qrFile = path.join(os.tmpdir(), 'waqr.png');

QRCode.toFile(qrFile, WA_URL, {
  errorCorrectionLevel: 'M',
  width: qrSize * 6,
  margin: 0,
  color: { dark: '#0b1020', light: '#ffffff' },
}).then(() => {
  ff([
    '-i', SRC, '-i', qrFile,
    '-filter_complex',
    `[0:v]split=2[base][forcrop];` +
    `[forcrop]crop=${D.w}:${D.h}:${D.x}:${D.y}[digits];` +
    `[1:v]scale=${qrSize}:${qrSize}:flags=neighbor[qr];` +
    // clear the whole old QR + Marathi text strip
    `[base]drawbox=x=${WIPE.x}:y=${WIPE.y}:w=${WIPE.w}:h=${WIPE.h}:color=${NAVY}:t=fill[p0];` +
    // white QR panel on the left of the strip + the QR
    `[p0]drawbox=x=${px0}:y=${py0}:w=${pw}:h=${ph}:color=white:t=fill[p1];` +
    `[p1][qr]overlay=${qx}:${qy}[p2];` +
    // caption to the right of the QR, centered in the remaining strip
    `[p2]drawtext=fontfile='${FONT}':text='SCAN':fontcolor=white:fontsize=64:` +
    `x=${px0 + pw}+((${WIPE.x + WIPE.w}-${px0 + pw})-text_w)/2:y=655[p2b];` +
    `[p2b]drawtext=fontfile='${FONT}':text='NOW':fontcolor=0xF0B429:fontsize=64:` +
    `x=${px0 + pw}+((${WIPE.x + WIPE.w}-${px0 + pw})-text_w)/2:y=735[p3];` +
    // phone-line edit (unchanged): shift digits over "+91", fill remnants
    `[p3][digits]overlay=${PASTE_X}:${D.y}[p4];` +
    `[p4]drawbox=x=${FILL.x}:y=${FILL.y}:w=${FILL.w}:h=${FILL.h}:color=${NAVY}:t=fill[p5];` +
    `[p5]drawbox=x=676:y=${D.y}:w=14:h=${D.h}:color=${NAVY}:t=fill`,
    '-frames:v', '1', OUT_PNG,
  ]);
  console.log(`final PNG: ${OUT_PNG}`);

  // 40in x 40in print PDF (printer scales 1in -> 1ft)
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
}).catch((e) => { console.error('failed:', e.message); process.exit(1); });
