// Generates AI images for the Anandi Park website.
// Uses Pollinations.ai — a free, no-API-key text-to-image service — so it works
// without Google billing. Saves into apps/web/public/site/ so Next.js serves
// them at /site/<name>.jpg (same-origin, no CORS, no API dependency).
//
// Run:  node scripts/generate-site-images.js

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'apps', 'web', 'public', 'site');

const STYLE =
  'photorealistic, professional real estate marketing photography, golden hour, ' +
  'clear blue sky, lush greenery, premium, high detail, no text, no watermark';

const CONTEXT =
  'premium gated residential land plotting project on Wagholi-Bakori Road, Pune East, ' +
  'Maharashtra India, empty demarcated residential plots, wide clean paved internal roads';

const IMAGES = [
  { name: 'hero-aerial', w: 1600, h: 900, prompt: `aerial drone view of a well planned ${CONTEXT}, grid of plots separated by paved roads, avenue trees, a few modern bungalows under construction at the edges, hills in the background, ${STYLE}` },
  { name: 'about-land', w: 800, h: 1000, prompt: `eye level view standing on a paved internal road of a ${CONTEXT}, plot corner stones and boundary markers, street light poles, young trees, ${STYLE}` },
  { name: 'about-green', w: 800, h: 560, prompt: `a landscaped central garden inside a gated residential plotting project, green lawn, walking path, benches, young trees, children play area, ${STYLE}` },
  { name: 'about-gate', w: 800, h: 560, prompt: `an elegant modern landscaped entrance archway gate to a gated residential plotting project with a security cabin and manicured hedges, ${STYLE}` },
  { name: 'internal-road', w: 1000, h: 700, prompt: `a wide freshly paved straight internal asphalt road through a plotted residential layout, demarcated plots on both sides, avenue trees, street lights, ${STYLE}` },
  { name: 'entry-gate', w: 1000, h: 700, prompt: `front view of a premium residential project entry gate with landscaped foreground and modern architecture, ${STYLE}` },
  { name: 'green-belt', w: 1000, h: 700, prompt: `a green belt and open amenity lawn within a residential plotting project, jogging path, families outdoors, trees, ${STYLE}` },
  { name: 'sample-villa', w: 1000, h: 700, prompt: `a modern two storey Indian bungalow villa built on a residential plot, contemporary architecture, compound wall, small garden, car in driveway, sunny day, ${STYLE}` },
  { name: 'aerial-view', w: 1000, h: 700, prompt: `high aerial view of an entire plotted residential township showing road grid pattern, plot demarcation, central green and surrounding greenery, sunny day, ${STYLE}` },
  { name: 'blog-wagholi', w: 800, h: 500, prompt: `aerial establishing shot of a fast growing Pune East suburb, new residential buildings, plotted developments, a highway, IT park buildings on the horizon, growth and investment, ${STYLE}` },
  { name: 'blog-plotvsflat', w: 800, h: 500, prompt: `conceptual real estate photo, an empty green residential plot with a boundary marker beside a modern apartment building, editorial, ${STYLE}` },
  { name: 'blog-checklist', w: 800, h: 500, prompt: `top down flat lay of Indian property legal documents on a wooden desk, a land title deed, a site layout map, a pen and a small model house, soft daylight, professional, no readable text` },
  { name: 'og-cover', w: 1200, h: 630, prompt: `aerial drone view of a premium ${CONTEXT}, cinematic, ${STYLE}` },
];

async function fetchImage(image, attempt = 1) {
  // seed keeps results stable across re-runs
  const seed = Math.abs([...image.name].reduce((a, c) => a + c.charCodeAt(0), 0));
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(image.prompt)}` +
    `?width=${image.w}&height=${image.h}&seed=${seed}&nologo=true&model=flux`;

  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 120000 });
    const buf = Buffer.from(res.data);
    if (buf.length < 3000) throw new Error(`too small (${buf.length} bytes)`);
    const file = path.join(OUT_DIR, `${image.name}.jpg`);
    fs.writeFileSync(file, buf);
    console.log(`  OK  ${image.name}.jpg (${Math.round(buf.length / 1024)} KB)`);
    return `${image.name}.jpg`;
  } catch (e) {
    if (attempt < 3) {
      console.log(`  retry ${image.name} (${e.message})`);
      await new Promise((r) => setTimeout(r, 5000));
      return fetchImage(image, attempt + 1);
    }
    console.log(`  FAILED ${image.name}: ${e.message}`);
    return null;
  }
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Generating ${IMAGES.length} images into ${OUT_DIR}\n`);

  const manifest = {};
  for (const image of IMAGES) {
    console.log(`Generating: ${image.name}...`);
    const filename = await fetchImage(image);
    if (filename) manifest[image.name] = `/site/${filename}`;
    await new Promise((r) => setTimeout(r, 2000));
  }

  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nDone. ${Object.keys(manifest).length}/${IMAGES.length} generated.`);
})();
