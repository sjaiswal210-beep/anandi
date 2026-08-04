// Generates AI images for the Anandi Park website.
// Prefers Gemini image models (needs billing); falls back to the free
// Pollinations.ai generator per-image if Gemini is unavailable.
// Saves into apps/web/public/site/ (served same-origin by Next.js).
//
// Run:  node scripts/generate-site-images.js

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'apps', 'web', 'public', 'site');
const env = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const KEY = (env.match(/^GEMINI_API_KEY=(.*)$/m) || [])[1]?.trim();
const GEMINI_MODEL = 'gemini-3.1-flash-image';

const STYLE =
  'photorealistic, professional real estate marketing photography, golden hour, ' +
  'clear blue sky, lush greenery, premium, high detail, no text, no watermark, no signage';
const CONTEXT =
  'premium gated residential land plotting project on Wagholi-Bakori Road, Pune East, ' +
  'Maharashtra India, empty demarcated residential plots, wide clean paved internal roads';

const IMAGES = [
  { name: 'hero-aerial', w: 1600, h: 900, prompt: `Wide cinematic aerial drone view of a well planned ${CONTEXT}, a grid of demarcated residential plots separated by paved roads, avenue trees, a few modern bungalows under construction at the edges, green farmland and Pune hills in background, ${STYLE}` },
  { name: 'about-land', w: 800, h: 1000, prompt: `Eye level view standing on a paved internal road of a ${CONTEXT}, plot corner stones and boundary markers, street light poles, young trees, open blue sky, ${STYLE}` },
  { name: 'about-green', w: 800, h: 560, prompt: `A landscaped central garden inside a gated residential plotting project, green lawn, walking path, benches, young trees, children play area in distance, ${STYLE}` },
  { name: 'about-gate', w: 800, h: 560, prompt: `An elegant modern landscaped entrance archway gate to a gated residential plotting project with a security cabin, manicured hedges and clean approach road, ${STYLE}` },
  { name: 'internal-road', w: 1000, h: 700, prompt: `A wide freshly paved straight internal asphalt road through a plotted residential layout, demarcated plots on both sides, avenue trees, street lights, perspective vanishing point, ${STYLE}` },
  { name: 'entry-gate', w: 1000, h: 700, prompt: `Front on view of a premium residential project entry gate with landscaped foreground and modern architecture, daytime blue sky, ${STYLE}` },
  { name: 'green-belt', w: 1000, h: 700, prompt: `A green belt and open amenity lawn within a residential plotting project, jogging path, families outdoors, trees, ${STYLE}` },
  { name: 'sample-villa', w: 1000, h: 700, prompt: `A modern two storey Indian bungalow villa built on a residential plot, contemporary architecture, compound wall, small garden, car in driveway, sunny day, ${STYLE}` },
  { name: 'aerial-view', w: 1000, h: 700, prompt: `High aerial view of an entire plotted residential township showing road grid pattern, plot demarcation, central green and surrounding greenery, sunny clear day, ${STYLE}` },
  { name: 'blog-wagholi', w: 800, h: 500, prompt: `Aerial establishing shot of a fast growing Pune East suburb, new residential buildings, plotted developments, a highway, IT park buildings on the horizon, symbolising growth and investment, ${STYLE}` },
  { name: 'blog-plotvsflat', w: 800, h: 500, prompt: `Conceptual real estate photo, an empty green residential plot with a boundary marker beside a modern apartment building, editorial, ${STYLE}` },
  { name: 'blog-checklist', w: 800, h: 500, prompt: `Top down flat lay of Indian property legal documents on a wooden desk, a land title deed, a site layout map, a pen and a small model house, soft daylight, professional, no readable text` },
  { name: 'og-cover', w: 1200, h: 630, prompt: `Aerial drone view of a premium ${CONTEXT}, cinematic, ${STYLE}` },
];

async function viaGemini(image) {
  if (!KEY) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(KEY)}`;
  try {
    const res = await axios.post(
      url,
      {
        contents: [{ role: 'user', parts: [{ text: `${image.prompt}. Aspect ratio ${image.w}x${image.h}.` }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 120000 },
    );
    const parts = res.data?.candidates?.[0]?.content?.parts || [];
    const inline = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
    const data = inline?.inlineData || inline?.inline_data;
    if (!data?.data) return null;
    const buf = Buffer.from(data.data, 'base64');
    fs.writeFileSync(path.join(OUT_DIR, `${image.name}.jpg`), buf);
    console.log(`  OK  ${image.name}.jpg (${Math.round(buf.length / 1024)} KB) via Gemini`);
    return true;
  } catch (e) {
    if (e.response?.status === 429) {
      await new Promise((r) => setTimeout(r, 15000));
      return viaGemini(image); // retry once after backoff
    }
    return null;
  }
}

async function viaPollinations(image) {
  const seed = Math.abs([...image.name].reduce((a, c) => a + c.charCodeAt(0), 0));
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(image.prompt)}` +
    `?width=${image.w}&height=${image.h}&seed=${seed}&nologo=true&model=flux`;
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 120000 });
    const buf = Buffer.from(res.data);
    if (buf.length < 3000) throw new Error('too small');
    fs.writeFileSync(path.join(OUT_DIR, `${image.name}.jpg`), buf);
    console.log(`  OK  ${image.name}.jpg (${Math.round(buf.length / 1024)} KB) via Pollinations`);
    return true;
  } catch (e) {
    console.log(`  FAILED ${image.name}: ${e.message}`);
    return false;
  }
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Generating ${IMAGES.length} images (Gemini preferred)\n`);
  let gemini = 0;
  for (const image of IMAGES) {
    console.log(`Generating: ${image.name}...`);
    const ok = await viaGemini(image);
    if (ok) gemini++;
    else await viaPollinations(image);
    await new Promise((r) => setTimeout(r, 2500));
  }
  console.log(`\nDone. ${gemini}/${IMAGES.length} via Gemini, rest via Pollinations.`);
})();
