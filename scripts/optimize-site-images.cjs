/**
 * Compresses the public site images in-place and generates WebP versions.
 *
 * The originals are ~0.8–4 MB each — far too heavy for a first-time mobile
 * visitor. This resizes each to a sane max width, re-encodes JPEG at quality 72
 * (mozjpeg), and writes a matching .webp (usually 25–35% smaller again).
 *
 * Safe: writes optimized JPEGs back to the same names (originals are in git, so
 * revert with `git checkout` if needed) and adds .webp siblings. Idempotent.
 *
 * Usage:  node scripts/optimize-site-images.cjs
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const DIR = path.join(__dirname, '..', 'apps', 'web', 'public', 'site');

// Max width per image role. Hero/aerial can be wide; cards/blog smaller.
const WIDTH_BY_HINT = [
  { match: /hero|aerial|layout-plan|green-belt|og-cover/, width: 1600 },
  { match: /about|blog|villa|entry|road|gate/, width: 1200 },
];
const defaultWidth = 1280;

function targetWidth(name) {
  for (const r of WIDTH_BY_HINT) if (r.match.test(name)) return r.width;
  return defaultWidth;
}

(async () => {
  if (!fs.existsSync(DIR)) {
    console.log('No site image dir at', DIR);
    return;
  }
  const files = fs.readdirSync(DIR).filter((f) => /\.jpe?g$/i.test(f));
  let beforeTotal = 0;
  let afterTotal = 0;

  for (const file of files) {
    const full = path.join(DIR, file);
    // Read the whole file into memory first so we never read+write the same
    // path concurrently (causes UNKNOWN file-lock errors on Windows).
    const srcBuf = fs.readFileSync(full);
    const before = srcBuf.length;
    beforeTotal += before;

    const width = targetWidth(file);
    const meta = await sharp(srcBuf).metadata();
    const resizeW = meta.width && meta.width > width ? width : meta.width;

    // Optimized JPEG (in place, from the in-memory source buffer).
    const jpgBuf = await sharp(srcBuf)
      .rotate()
      .resize({ width: resizeW, withoutEnlargement: true })
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer();
    fs.writeFileSync(full, jpgBuf);

    // WebP sibling.
    const webpPath = full.replace(/\.jpe?g$/i, '.webp');
    const webpBuf = await sharp(jpgBuf)
      .webp({ quality: 70 })
      .toBuffer();
    fs.writeFileSync(webpPath, webpBuf);

    afterTotal += jpgBuf.length;
    console.log(
      `${file.padEnd(24)} ${(before / 1024).toFixed(0)}KB -> jpg ${(jpgBuf.length / 1024).toFixed(0)}KB, webp ${(webpBuf.length / 1024).toFixed(0)}KB`,
    );
  }

  console.log(
    `\nTotal JPEG: ${(beforeTotal / 1024 / 1024).toFixed(1)}MB -> ${(afterTotal / 1024 / 1024).toFixed(1)}MB (+ webp siblings, smaller still)`,
  );
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
