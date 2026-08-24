// Reports basic PNG facts + corner colors using ffmpeg (no image libs needed).
// Usage: node scripts/inspect-png.js <path-to-png>
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error('file not found:', file);
  process.exit(1);
}

function probe() {
  const out = execFileSync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,pix_fmt',
    '-of', 'json', file,
  ], { encoding: 'utf8' });
  return JSON.parse(out).streams[0];
}

function pixel(x, y) {
  const tmp = path.join(os.tmpdir(), `px_${Date.now()}_${x}_${y}.raw`);
  execFileSync('ffmpeg', [
    '-v', 'error', '-y', '-i', file,
    '-vf', `crop=4:4:${x}:${y},scale=1:1`,
    '-f', 'rawvideo', '-pix_fmt', 'rgb24', tmp,
  ]);
  const b = fs.readFileSync(tmp);
  fs.unlinkSync(tmp);
  return [b[0], b[1], b[2]];
}

const s = probe();
console.log(`size: ${s.width}x${s.height}  pix_fmt: ${s.pix_fmt}`);
const w = s.width, h = s.height;
console.log('top-left  ', pixel(0, 0));
console.log('top-right ', pixel(w - 4, 0));
console.log('bot-left  ', pixel(0, h - 4));
console.log('bot-right ', pixel(w - 4, h - 4));
console.log('center    ', pixel(Math.floor(w / 2), Math.floor(h / 2)));
