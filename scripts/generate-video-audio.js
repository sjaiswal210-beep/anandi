// Generates voiceover audio for the Anandi Park promo video in Hindi, Marathi, and English.
// Uses Sarvam TTS. Saves to anandi-park-promo/assets/

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ROOT = path.resolve(__dirname, '..');
const env = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const KEY = (env.match(/^SARVAM_API_KEY=(.*)$/m) || [])[1]?.trim();
const OUT = path.join(ROOT, 'anandi-park-promo', 'assets');

if (!KEY) { console.error('SARVAM_API_KEY not found in .env'); process.exit(1); }

// Voiceover scripts timed to match the 6 scenes.
// Each is a single block — Sarvam generates one continuous audio per text.
const SCRIPTS = {
  hindi: {
    lang: 'hi-IN',
    speaker: 'anushka',
    text: `Anandi Park. Wagholi, Pune ka sabse premium residential plotting project.
Wagholi Bakori road par, sirf atharah lakh se shuru.
Chauranve plots, ek hazaar se saadhe chaar hazaar square feet tak.
Clear titles, gated layout, chaalis feet wide roads.
Wagheshwar mandir sirf das minute, schools das minute, Kharadi IT hub pachchees minute, airport tees minute.
Landscaped entry gate, chaubees ghante paani-bijli, central garden, security cabin, CCTV.
Loan facility available — sirf das percent booking se aaj hi plot aapke naam.
Wagholi mein zameen ki value har saal badh rahi hai. Aaj khareedein, kal munafa kamayein.
Site visit bilkul free hai. Aaj hi call karein.
Yuvraj Gade aur Rajan Kute Developers.`,
  },
  marathi: {
    lang: 'mr-IN',
    speaker: 'anushka',
    text: `Anandi Park. Wagholi, Pune madhla premium residential plotting project.
Wagholi Bakori road var, phakta athra lakh pasun suru.
Chauryaainshi plots, ek hazaar te saadhe chaar hazaar square feet.
Clear titles, gated layout, chaalis feet rund roads.
Wagheshwar mandir phakta daha minute, shalaa daha minute, Kharadi IT hub pandhra minute, airport tees minute.
Landscaped entry gate, chovis taas paani-vij, central garden, security cabin.
Loan facility uplabdha aahe — phakta daha percent booking madhye plot tumchya naavavar.
Wagholi madhe jameenichi kimmat darvaarshi vadhat aahe. Aaj ghya, udya nafa kamva.
Site visit free aahe. Aajach call kara.
Yuvraj Gade ani Rajan Kute Developers.`,
  },
  english: {
    lang: 'en-IN',
    speaker: 'anushka',
    text: `Anandi Park. The most premium residential plotting project in Wagholi, Pune.
Located on Wagholi Bakori Road, starting from just eighteen lakhs.
Eighty-four plots, one thousand to four thousand five hundred square feet.
Clear titles, gated layout, forty-feet-wide roads.
Ten minutes from Wagheshwar Temple, ten minutes from top schools, twenty-five minutes from Kharadi IT Hub, thirty minutes from Pune Airport.
Landscaped entry gate, twenty-four-seven water and electricity, central garden, security with CCTV.
Loan facility available. Just ten percent booking and the plot is yours today.
Land prices in Wagholi are rising every year. Buy today, profit tomorrow.
Free site visit available. Call now.
By Yuvraj Gade and Rajan Kute Developers.`,
  },
};

async function generateAudio(name, script) {
  console.log(`Generating: ${name} (${script.lang})...`);

  // Sarvam limits to 500 chars per call. Split into sentences and batch.
  const sentences = script.text.split('\n').filter((s) => s.trim());
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > 480) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + ' ' + sentence : sentence;
    }
  }
  if (current) chunks.push(current.trim());

  console.log(`  Split into ${chunks.length} chunks`);

  const buffers = [];

  for (let i = 0; i < chunks.length; i++) {
    try {
      const res = await axios.post(
        'https://api.sarvam.ai/text-to-speech',
        {
          inputs: [chunks[i]],
          target_language_code: script.lang,
          speaker: script.speaker,
          model: 'bulbul:v2',
        },
        {
          headers: { 'api-subscription-key': KEY },
          timeout: 60000,
        },
      );

      const audioB64 = res.data?.audios?.[0];
      if (audioB64) {
        buffers.push(Buffer.from(audioB64, 'base64'));
        console.log(`  Chunk ${i + 1}/${chunks.length} OK`);
      }
      await new Promise((r) => setTimeout(r, 1000));
    } catch (e) {
      console.error(`  Chunk ${i + 1} ERROR: ${e.response?.data?.error?.message || e.message}`);
    }
  }

  if (buffers.length === 0) { console.log(`  No audio generated for ${name}`); return null; }

  // Concatenate all WAV buffers (simple append — all same format from Sarvam)
  // WAV header is 44 bytes. Take header from first, append raw data from all.
  const header = buffers[0].slice(0, 44);
  const rawChunks = buffers.map((b, i) => i === 0 ? b.slice(44) : b.slice(44));
  const totalDataSize = rawChunks.reduce((s, b) => s + b.length, 0);

  // Fix the file size in the WAV header
  const combined = Buffer.concat([header, ...rawChunks]);
  combined.writeUInt32LE(combined.length - 8, 4); // RIFF chunk size
  combined.writeUInt32LE(totalDataSize, 40); // data chunk size

  const file = path.join(OUT, `voiceover-${name}.wav`);
  fs.writeFileSync(file, combined);
  console.log(`  DONE: ${file} (${Math.round(combined.length / 1024)} KB)`);
  return file;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  console.log(`Generating voiceovers using Sarvam TTS...\n`);

  for (const [name, script] of Object.entries(SCRIPTS)) {
    await generateAudio(name, script);
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log('\nDone. Files saved to anandi-park-promo/assets/');
  console.log('Now add them to the HyperFrames composition or use ffmpeg to mux.');
})();
