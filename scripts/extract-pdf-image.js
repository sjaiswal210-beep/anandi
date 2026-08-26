// Extracts embedded JPEG/PNG images from a PDF by scanning for magic bytes.
// Works for "image wrapped in a PDF" files regardless of object streams.
// Usage: node scripts/extract-pdf-image.js "<pdf>" "<outdir>"
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const pdf = process.argv[2];
const outDir = process.argv[3] || '.';
const buf = fs.readFileSync(pdf);
fs.mkdirSync(outDir, { recursive: true });

let found = 0;

// 1. Raw JPEG scan (DCTDecode streams are stored as plain JPEG bytes).
for (let i = 0; i < buf.length - 3; i++) {
  if (buf[i] === 0xff && buf[i + 1] === 0xd8 && buf[i + 2] === 0xff) {
    // find EOI
    for (let j = i + 3; j < buf.length - 1; j++) {
      if (buf[j] === 0xff && buf[j + 1] === 0xd9) {
        const size = j + 2 - i;
        if (size > 100000) { // only meaningful images
          const out = path.join(outDir, `extracted-${found}.jpg`);
          fs.writeFileSync(out, buf.slice(i, j + 2));
          console.log(`JPEG ${found}: ${Math.round(size / 1024)} KB -> ${out}`);
          found++;
        }
        i = j + 1;
        break;
      }
    }
  }
}

// 2. Flate streams that decode to PNG (rare but cheap to check).
const s = buf.toString('latin1');
const re = /stream\r?\n/g;
let m;
while ((m = re.exec(s)) !== null) {
  const start = m.index + m[0].length;
  const end = s.indexOf('endstream', start);
  if (end < 0) continue;
  const chunk = buf.slice(start, end);
  try {
    const inf = zlib.inflateSync(chunk);
    if (inf.length > 100000 && inf[0] === 0x89 && inf[1] === 0x50) {
      const out = path.join(outDir, `extracted-${found}.png`);
      fs.writeFileSync(out, inf);
      console.log(`PNG ${found}: ${Math.round(inf.length / 1024)} KB -> ${out}`);
      found++;
    }
  } catch { /* not flate or not a full stream */ }
  re.lastIndex = end;
}

console.log(found ? `\n${found} image(s) extracted.` : 'No large embedded images found.');
