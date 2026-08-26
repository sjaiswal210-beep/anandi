// Extracts a ReportLab-style embedded image: /Filter [/ASCII85Decode /FlateDecode]
// with raw DeviceRGB pixels. Writes a PNG via ffmpeg rawvideo.
// Usage: node scripts/extract-pdf-a85.js "<pdf>" "<out.png>"
const fs = require('fs');
const zlib = require('zlib');
const { execFileSync } = require('child_process');
const os = require('os');
const path = require('path');

const pdfPath = process.argv[2];
const outPng = process.argv[3];
const buf = fs.readFileSync(pdfPath);
const s = buf.toString('latin1');

// Find the image object header to get dimensions.
const hdr = /\/Height (\d+)[\s\S]{0,200}?\/Width (\d+)|\/Width (\d+)[\s\S]{0,200}?\/Height (\d+)/.exec(
  s.slice(0, 4000),
);
const height = Number(hdr[1] || hdr[4]);
const width = Number(hdr[2] || hdr[3]);
console.log(`image: ${width}x${height} DeviceRGB`);

// Stream bounds: first "stream" after the image object.
const start = s.indexOf('stream', s.indexOf('/Subtype /Image')) + 'stream'.length;
const dataStart = s[start] === '\r' ? start + 2 : start + 1;
const end = s.indexOf('endstream', dataStart);
let a85 = s.slice(dataStart, end).replace(/\s+/g, '');
if (a85.endsWith('~>')) a85 = a85.slice(0, -2);

// ASCII85 decode
function a85decode(str) {
  const out = [];
  let tuple = [];
  for (const ch of str) {
    if (ch === 'z' && tuple.length === 0) { out.push(0, 0, 0, 0); continue; }
    tuple.push(ch.charCodeAt(0) - 33);
    if (tuple.length === 5) {
      let n = 0;
      for (const d of tuple) n = n * 85 + d;
      out.push((n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255);
      tuple = [];
    }
  }
  if (tuple.length > 1) {
    const k = tuple.length;
    for (let i = k; i < 5; i++) tuple.push(84);
    let n = 0;
    for (const d of tuple) n = n * 85 + d;
    const bytes = [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
    out.push(...bytes.slice(0, k - 1));
  }
  return Buffer.from(out);
}

const flate = a85decode(a85);
const raw = zlib.inflateSync(flate);
console.log(`raw pixels: ${raw.length} bytes (expect ${width * height * 3})`);

const tmp = path.join(os.tmpdir(), 'pdfimg.raw');
fs.writeFileSync(tmp, raw);
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
  '-s', `${width}x${height}`, '-i', tmp, outPng]);
fs.unlinkSync(tmp);
console.log(`wrote ${outPng}`);
