// Minimal .docx text extractor: unzip document.xml and strip tags.
// Usage: node scripts/read-docx.js "<path-to-docx>"
const fs = require('fs');
const zlib = require('zlib');

const file = process.argv[2];
if (!file || !fs.existsSync(file)) { console.error('not found:', file); process.exit(1); }

const buf = fs.readFileSync(file);

// Parse the ZIP central directory minimally to find word/document.xml entries.
// Simpler: scan for local file headers (PK\x03\x04) and inflate the ones we want.
const entries = [];
let i = 0;
while (i < buf.length - 4) {
  if (buf[i] === 0x50 && buf[i+1] === 0x4b && buf[i+2] === 0x03 && buf[i+3] === 0x04) {
    const method = buf.readUInt16LE(i + 8);
    const compSize = buf.readUInt32LE(i + 18);
    const nameLen = buf.readUInt16LE(i + 26);
    const extraLen = buf.readUInt16LE(i + 28);
    const name = buf.toString('utf8', i + 30, i + 30 + nameLen);
    const dataStart = i + 30 + nameLen + extraLen;
    if (/word\/(document|header\d*|footer\d*)\.xml$/.test(name) && compSize > 0) {
      const comp = buf.slice(dataStart, dataStart + compSize);
      try {
        const xml = method === 8 ? zlib.inflateRawSync(comp).toString('utf8') : comp.toString('utf8');
        entries.push({ name, xml });
      } catch (e) { /* skip */ }
    }
    i = dataStart + compSize;
  } else {
    i++;
  }
}

function xmlToText(xml) {
  return xml
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<w:br\/>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n');
}

if (entries.length === 0) { console.error('no document.xml found (compressed method unsupported?)'); process.exit(2); }
for (const e of entries.sort((a,b)=>a.name.localeCompare(b.name))) {
  console.log(`\n===== ${e.name} =====`);
  console.log(xmlToText(e.xml).trim());
}
