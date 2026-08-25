/**
 * Generates the Marathi voiceover for the "Land vs Flat" ad (the cinematic hero
 * film in brand/ad-campaign/anandi-park-ad-package.md), using Sarvam TTS.
 *
 * One WAV per scene line (so you can drop each onto its scene in the edit) PLUS
 * one stitched full-length WAV for a quick listen / single-track drop-in.
 *
 * Output: brand/ad-campaign/audio/marathi/
 *   scene-1.wav ... scene-7.wav   (per-scene, for precise placement)
 *   anandi-park-ad-marathi.wav    (full stitched VO with short gaps)
 *
 * Usage: node scripts/generate-ad-vo-marathi.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ROOT = path.resolve(__dirname, '..');
const env = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const KEY = (env.match(/^SARVAM_API_KEY=(.*)$/m) || [])[1]?.trim();
const OUT = path.join(ROOT, 'brand', 'ad-campaign', 'audio', 'marathi');

if (!KEY) { console.error('SARVAM_API_KEY not found in .env'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

const LANG = 'mr-IN';
const SPEAKER = 'anushka'; // same voice family used for the promo, for brand consistency
const MODEL = 'bulbul:v2';

// Marathi ad VO in Devanagari, English brand words kept in Latin (Sarvam handles
// code-mixed). One entry per scene of the 35s "Land vs Flat" film.
const SCENES = [
  { id: 'scene-1', text: 'तुमचा flat दरवर्षी थोडा थोडा कमी होत जातो.' },
  { id: 'scene-2', text: 'पण जमीन? जमीन दरवर्षी वाढते.' },
  { id: 'scene-3', text: 'Anandi Park. वाघोली जवळ. चौऱ्याऐंशी plots, स्वतःची clear title जमीन, फक्त अठरा लाखांपासून.' },
  { id: 'scene-4', text: 'इथे तुम्ही flat नाही, जमीन घेता.' },
  { id: 'scene-5', text: 'Gated layout, चाळीस फूट रस्ते, खराडी फक्त पंचवीस मिनिटे. आणि booking? फक्त दहा टक्के.' },
  { id: 'scene-6', text: 'बाकी EMI मध्ये. जमीन आजपासून तुमच्या नावावर.' },
  { id: 'scene-7', text: 'Anandi Park. स्वतःची जमीन, स्वतःची value.' },
];

async function tts(text) {
  const res = await axios.post(
    'https://api.sarvam.ai/text-to-speech',
    { inputs: [text], target_language_code: LANG, speaker: SPEAKER, model: MODEL },
    { headers: { 'api-subscription-key': KEY }, timeout: 60000 },
  );
  const b64 = res.data?.audios?.[0];
  if (!b64) throw new Error('no audio returned');
  return Buffer.from(b64, 'base64');
}

/** Concatenate WAV buffers (same format from Sarvam), optionally inserting silence. */
function stitch(buffers, gapMs = 350) {
  const header = Buffer.from(buffers[0].slice(0, 44));
  const sampleRate = header.readUInt32LE(24);
  const channels = header.readUInt16LE(22);
  const bits = header.readUInt16LE(34);
  const bytesPerSample = (bits / 8) * channels;
  const gapBytes = Math.round((gapMs / 1000) * sampleRate) * bytesPerSample;
  const silence = Buffer.alloc(gapBytes);

  const parts = [];
  buffers.forEach((b, i) => {
    parts.push(b.slice(44));
    if (i < buffers.length - 1) parts.push(silence);
  });
  const data = Buffer.concat(parts);
  const out = Buffer.concat([header, data]);
  out.writeUInt32LE(out.length - 8, 4);
  out.writeUInt32LE(data.length, 40);
  return out;
}

(async () => {
  console.log(`Generating Marathi ad VO (${LANG}, ${SPEAKER})...\n`);
  const buffers = [];
  for (const s of SCENES) {
    try {
      const buf = await tts(s.text);
      fs.writeFileSync(path.join(OUT, `${s.id}.wav`), buf);
      buffers.push(buf);
      console.log(`  ${s.id}: OK (${Math.round(buf.length / 1024)} KB)`);
      await new Promise((r) => setTimeout(r, 900));
    } catch (e) {
      console.error(`  ${s.id}: ERROR ${e.response?.data?.error?.message || e.message}`);
    }
  }
  if (buffers.length) {
    const full = stitch(buffers, 350);
    const file = path.join(OUT, 'anandi-park-ad-marathi.wav');
    fs.writeFileSync(file, full);
    console.log(`\nStitched: ${file} (${Math.round(full.length / 1024)} KB)`);
  }
  console.log('\nDone. Files in brand/ad-campaign/audio/marathi/');
})();
