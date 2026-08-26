// Probes the flex image to find the QR white panel's exact bounds by scanning
// for long CONTIGUOUS white runs (the panel), not scattered white text pixels.
// Usage: node scripts/probe-flex-panel.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'brand', 'dist', 'flex-final', 'flex-source.png');
const W = 1254, H = 1254;
const rawFile = path.join(os.tmpdir(), 'probe.raw');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', SRC, '-f', 'rawvideo', '-pix_fmt', 'rgb24', rawFile]);
const raw = fs.readFileSync(rawFile);
fs.unlinkSync(rawFile);

const white = (x, y) => {
  const i = (y * W + x) * 3;
  return raw[i] > 225 && raw[i + 1] > 225 && raw[i + 2] > 225;
};

// For a set of rows, print contiguous white runs longer than 60px.
function runsInRow(y) {
  const runs = [];
  let start = -1;
  for (let x = 0; x < W; x++) {
    if (white(x, y)) { if (start < 0) start = x; }
    else if (start >= 0) { if (x - start > 60) runs.push([start, x - 1]); start = -1; }
  }
  if (start >= 0 && W - start > 60) runs.push([start, W - 1]);
  return runs;
}
function runsInCol(x) {
  const runs = [];
  let start = -1;
  for (let y = 0; y < H; y++) {
    if (white(x, y)) { if (start < 0) start = y; }
    else if (start >= 0) { if (y - start > 60) runs.push([start, y - 1]); start = -1; }
  }
  if (start >= 0 && H - start > 60) runs.push([start, H - 1]);
  return runs;
}

console.log('rows (y: [white runs >60px]):');
for (const y of [600, 640, 680, 700, 720, 760, 790]) {
  console.log(` y=${y}:`, JSON.stringify(runsInRow(y)));
}
console.log('cols (x: [white runs >60px]):');
for (const x of [760, 790, 820, 850, 880, 910]) {
  console.log(` x=${x}:`, JSON.stringify(runsInCol(x)));
}
