/**
 * Builds the full Rich-Land Developers branding kit from the master logo,
 * using ffmpeg (no Photoshop / ImageMagick needed).
 *
 * Master:  <repo>/../richlandlogo.png  (1254x1254, dark navy background)
 * Output:  <repo>/brand/dist/...
 *
 * Produces:
 *   logo-on-dark/     square + wide, on the original dark background
 *   logo-on-white/    same, composited on white (for light backgrounds / print)
 *   logo-transparent/ dark background keyed to alpha (overlay on photos/flex)
 *   mark/             centered square crop for app icon / avatar use
 *   favicon/          16/32/48/180/512
 *   social/           avatars, FB cover, IG post, IG story
 *   print/            300 DPI large-format versions for flex / banner
 *   web/              copies dropped into apps/web/public for the live site
 *
 * Usage: node scripts/build-brand-kit.js
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');
// Prefer the in-repo master (travels with the project); fall back to the
// original location one level above the repo.
const MASTER_CANDIDATES = [
  path.join(REPO, 'brand', 'richlandlogo-master.png'),
  path.join(REPO, '..', 'richlandlogo.png'),
];
const MASTER = MASTER_CANDIDATES.find((p) => fs.existsSync(p)) || MASTER_CANDIDATES[0];
const DIST = path.join(REPO, 'brand', 'dist');
const WEB_PUBLIC = path.join(REPO, 'apps', 'web', 'public', 'brand');

const SLATE = '0x0F172A';     // brand slate, used for padding/backgrounds
const GOLD = 'F59E0B';

if (!fs.existsSync(MASTER)) {
  console.error(`Master logo not found at ${MASTER}`);
  console.error('Place richlandlogo.png in the "Real estate" folder (one level above the repo).');
  process.exit(1);
}

function ff(args) {
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
}

function ensure(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const out = (sub) => ensure(path.join(DIST, sub));

// ── 1. Square logo on the original dark background, multiple sizes ──
function squareOnDark() {
  const dir = out('logo-on-dark');
  for (const s of [512, 1024, 2048, 4096]) {
    ff(['-i', MASTER, '-vf', `scale=${s}:${s}:flags=lanczos`, path.join(dir, `richland-square-${s}.png`)]);
  }
  // Wide/banner lockup: logo centered on a 16:9 slate canvas.
  for (const [w, h] of [[1920, 1080], [2560, 1440], [3840, 2160]]) {
    const logoH = Math.round(h * 0.62);
    ff([
      '-f', 'lavfi', '-i', `color=c=${SLATE}:s=${w}x${h}`,
      '-i', MASTER,
      '-filter_complex',
      `[1:v]scale=-1:${logoH}:flags=lanczos[l];[0:v][l]overlay=(W-w)/2:(H-h)/2`,
      '-frames:v', '1', path.join(dir, `richland-wide-${w}x${h}.png`),
    ]);
  }
}

// ── 2. Transparent version: key out the dark navy background ──
// colorkey targets the slate; similarity/blend tuned for a clean edge.
function transparent() {
  const dir = out('logo-transparent');
  const keyed = path.join(dir, '_keyed_master.png');
  ff([
    '-i', MASTER,
    '-vf', 'colorkey=0x0F172A:0.30:0.10,format=rgba',
    keyed,
  ]);
  for (const s of [512, 1024, 2048, 4096]) {
    ff(['-i', keyed, '-vf', `scale=${s}:${s}:flags=lanczos`, path.join(dir, `richland-transparent-${s}.png`)]);
  }
  return keyed;
}

// ── 3. Logo on white (composite the transparent version over white) ──
function onWhite(keyed) {
  const dir = out('logo-on-white');
  for (const s of [512, 1024, 2048, 4096]) {
    ff([
      '-f', 'lavfi', '-i', `color=c=white:s=${s}x${s}`,
      '-i', keyed,
      '-filter_complex',
      `[1:v]scale=${Math.round(s * 0.86)}:-1:flags=lanczos[l];[0:v][l]overlay=(W-w)/2:(H-h)/2`,
      '-frames:v', '1', path.join(dir, `richland-white-${s}.png`),
    ]);
  }
}

// ── 4. Mark (square icon) — the master is already square, produce icon sizes ──
function mark() {
  const dir = out('mark');
  for (const s of [256, 512, 1024]) {
    ff(['-i', MASTER, '-vf', `scale=${s}:${s}:flags=lanczos`, path.join(dir, `richland-mark-${s}.png`)]);
  }
}

// ── 5. Favicons + apple touch icon ──
function favicons() {
  const dir = out('favicon');
  for (const s of [16, 32, 48, 180, 512]) {
    ff(['-i', MASTER, '-vf', `scale=${s}:${s}:flags=lanczos`, path.join(dir, `favicon-${s}.png`)]);
  }
}

// ── 6. Social presets ──
function social() {
  const dir = out('social');
  // Profile avatar (IG/FB/YT accept square; keep logo padded so it survives circle crop)
  for (const s of [400, 1000]) {
    ff([
      '-f', 'lavfi', '-i', `color=c=${SLATE}:s=${s}x${s}`,
      '-i', MASTER,
      '-filter_complex',
      `[1:v]scale=${Math.round(s * 0.78)}:-1:flags=lanczos[l];[0:v][l]overlay=(W-w)/2:(H-h)/2`,
      '-frames:v', '1', path.join(dir, `avatar-${s}.png`),
    ]);
  }
  // Facebook cover 820x312 (safe area centered)
  ff([
    '-f', 'lavfi', '-i', `color=c=${SLATE}:s=1640x624`,
    '-i', MASTER,
    '-filter_complex',
    `[1:v]scale=-1:440:flags=lanczos[l];[0:v][l]overlay=(W-w)/2:(H-h)/2`,
    '-frames:v', '1', path.join(dir, 'facebook-cover-1640x624.png'),
  ]);
  // Instagram square post 1080x1080 (logo top, space for text below)
  ff([
    '-f', 'lavfi', '-i', `color=c=${SLATE}:s=1080x1080`,
    '-i', MASTER,
    '-filter_complex',
    `[1:v]scale=620:620:flags=lanczos[l];[0:v][l]overlay=(W-w)/2:200`,
    '-frames:v', '1', path.join(dir, 'ig-post-template-1080.png'),
  ]);
  // Instagram story 1080x1920
  ff([
    '-f', 'lavfi', '-i', `color=c=${SLATE}:s=1080x1920`,
    '-i', MASTER,
    '-filter_complex',
    `[1:v]scale=640:640:flags=lanczos[l];[0:v][l]overlay=(W-w)/2:360`,
    '-frames:v', '1', path.join(dir, 'ig-story-template-1080x1920.png'),
  ]);
}

// ── 7. Print / flex (300 DPI large format) ──
function print() {
  const dir = out('print');
  // A4-ish poster at 300 DPI portrait: 2480x3508. Logo in the upper third.
  ff([
    '-f', 'lavfi', '-i', `color=c=${SLATE}:s=2480x3508`,
    '-i', MASTER,
    '-filter_complex',
    `[1:v]scale=1400:1400:flags=lanczos[l];[0:v][l]overlay=(W-w)/2:520`,
    '-frames:v', '1', path.join(dir, 'poster-A4-300dpi.png'),
  ]);
  // Wide flex banner base 6000x2000 (e.g. large hoarding proportion)
  ff([
    '-f', 'lavfi', '-i', `color=c=${SLATE}:s=6000x2000`,
    '-i', MASTER,
    '-filter_complex',
    `[1:v]scale=1500:1500:flags=lanczos[l];[0:v][l]overlay=360:(H-h)/2`,
    '-frames:v', '1', path.join(dir, 'flex-banner-6000x2000.png'),
  ]);
  // High-res square for any generic print use
  ff(['-i', MASTER, '-vf', 'scale=4096:4096:flags=lanczos', path.join(dir, 'richland-square-4096-print.png')]);
}

// ── 8. Copy web-ready assets into apps/web/public/brand ──
function web(keyed) {
  ensure(WEB_PUBLIC);
  fs.copyFileSync(path.join(DIST, 'logo-on-dark', 'richland-square-1024.png'), path.join(WEB_PUBLIC, 'richland-square.png'));
  fs.copyFileSync(path.join(DIST, 'logo-transparent', 'richland-transparent-1024.png'), path.join(WEB_PUBLIC, 'richland-transparent.png'));
  fs.copyFileSync(path.join(DIST, 'logo-on-white', 'richland-white-1024.png'), path.join(WEB_PUBLIC, 'richland-white.png'));
  fs.copyFileSync(path.join(DIST, 'favicon', 'favicon-512.png'), path.join(WEB_PUBLIC, 'favicon-512.png'));
  fs.copyFileSync(path.join(DIST, 'favicon', 'favicon-180.png'), path.join(WEB_PUBLIC, 'apple-touch-icon.png'));
  fs.copyFileSync(path.join(DIST, 'social', 'ig-post-template-1080.png'), path.join(WEB_PUBLIC, 'og-brand-1080.png'));
}

console.log('Building Rich-Land brand kit from', MASTER);
squareOnDark();
const keyed = transparent();
onWhite(keyed);
mark();
favicons();
social();
print();
web(keyed);

// Clean the intermediate keyed master (the sized transparent PNGs remain).
try { fs.unlinkSync(keyed); } catch { /* already gone */ }

// Print an index of everything produced.
function tree(dir, prefix = '') {
  for (const name of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      console.log(`${prefix}${name}/`);
      tree(full, prefix + '  ');
    } else {
      const kb = (fs.statSync(full).size / 1024).toFixed(0);
      console.log(`${prefix}${name}  (${kb} KB)`);
    }
  }
}
console.log('\nGenerated brand/dist:');
tree(DIST, '  ');
console.log('\nWeb copies in apps/web/public/brand.');
console.log('Done.');
