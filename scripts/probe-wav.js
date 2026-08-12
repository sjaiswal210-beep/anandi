// Probe WAV headers to get exact duration/sample rate without needing ffmpeg.
const fs = require('fs');
const path = require('path');

const dir = process.argv[2] || 'anandi-park-promo/assets';

for (const file of fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.wav'))) {
  const full = path.join(dir, file);
  const buf = fs.readFileSync(full);

  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    console.log(`${file}: not a RIFF/WAVE file`);
    continue;
  }

  let offset = 12;
  let fmt = null;
  let dataBytes = null;

  while (offset + 8 <= buf.length) {
    const id = buf.toString('ascii', offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    const body = offset + 8;

    if (id === 'fmt ') {
      fmt = {
        audioFormat: buf.readUInt16LE(body),
        channels: buf.readUInt16LE(body + 2),
        sampleRate: buf.readUInt32LE(body + 4),
        byteRate: buf.readUInt32LE(body + 8),
        bitsPerSample: buf.readUInt16LE(body + 14),
      };
    } else if (id === 'data') {
      dataBytes = Math.min(size, buf.length - body);
      break;
    }
    offset = body + size + (size % 2); // chunks are word-aligned
  }

  if (!fmt || dataBytes == null) {
    console.log(`${file}: could not locate fmt/data chunks`);
    continue;
  }

  const bytesPerFrame = (fmt.bitsPerSample / 8) * fmt.channels;
  const seconds = dataBytes / (bytesPerFrame * fmt.sampleRate);

  console.log(
    `${file.padEnd(24)} ${seconds.toFixed(2).padStart(7)}s  ` +
      `${fmt.sampleRate} Hz  ${fmt.channels}ch  ${fmt.bitsPerSample}-bit  ` +
      `${(buf.length / 1024 / 1024).toFixed(2)} MB`
  );
}
