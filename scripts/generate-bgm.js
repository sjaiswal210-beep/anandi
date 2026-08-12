/**
 * Generates the Anandi Park promo background music bed.
 *
 * Why synthesized instead of downloaded: the previous composition pointed at a
 * Pixabay CDN URL, which (a) now returns 403 and (b) violates the HyperFrames
 * determinism rule against network access at render time. This produces a
 * license-clean, byte-identical-on-every-run local file instead.
 *
 * Musically: a warm ambient pad on a I-V-vi-IV progression in C major, with a
 * sub bass and a sparse bell arpeggio. Deliberately unobtrusive -- it sits at
 * ~14% volume underneath a voiceover.
 *
 * Usage: node scripts/generate-bgm.js [outWavPath] [seconds]
 */

const fs = require('fs');
const path = require('path');

const OUT = process.argv[2] || 'anandi-park-promo/assets/bgm.wav';
const DURATION = Number(process.argv[3] || 48);

const SR = 44100;
const CHORD_SECS = 4;

// I - V - vi - IV in C major. Aspirational without being saccharine.
const PROGRESSION = [
  { bass: 36, pad: [48, 52, 55, 60] }, // C
  { bass: 31, pad: [43, 47, 50, 55] }, // G
  { bass: 33, pad: [45, 48, 52, 57] }, // Am
  { bass: 29, pad: [41, 45, 48, 53] }, // F
];

const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

/** Equal-power crossfade envelope for a chord, so pads overlap smoothly. */
function padEnvelope(t, len) {
  const attack = 1.3;
  const release = 1.6;
  if (t < 0 || t > len) return 0;
  if (t < attack) return Math.sin((t / attack) * (Math.PI / 2));
  if (t > len - release) return Math.sin(((len - t) / release) * (Math.PI / 2));
  return 1;
}

/** Warm pad voice: a few low partials plus a detuned twin for chorus width. */
function padVoice(freq, t, detune) {
  const f = freq * (1 + detune);
  const p = 2 * Math.PI * f * t;
  return (
    Math.sin(p) * 0.6 +
    Math.sin(p * 2) * 0.18 +
    Math.sin(p * 3) * 0.07 +
    Math.sin(p * 4) * 0.03
  );
}

function render() {
  const total = Math.floor(DURATION * SR);
  const left = new Float64Array(total);
  const right = new Float64Array(total);

  const chordCount = Math.ceil(DURATION / CHORD_SECS) + 1;

  for (let c = 0; c < chordCount; c++) {
    const chord = PROGRESSION[c % PROGRESSION.length];
    const startT = c * CHORD_SECS;
    // Overlap each chord slightly into the next for a seamless bed.
    const len = CHORD_SECS + 1.6;
    const startSample = Math.floor(startT * SR);
    const endSample = Math.min(total, Math.floor((startT + len) * SR));

    for (let i = startSample; i < endSample; i++) {
      if (i < 0) continue;
      const tAbs = i / SR;
      const tRel = tAbs - startT;
      const env = padEnvelope(tRel, len);
      if (env <= 0) continue;

      let l = 0;
      let r = 0;

      // Pad stack
      for (let n = 0; n < chord.pad.length; n++) {
        const freq = midiToFreq(chord.pad[n]);
        const gain = 0.24 / (1 + n * 0.35);
        l += padVoice(freq, tAbs, -0.0012) * gain;
        r += padVoice(freq, tAbs, +0.0012) * gain;
      }

      // Sub bass, sine only
      const bf = midiToFreq(chord.bass);
      const bass = Math.sin(2 * Math.PI * bf * tAbs) * 0.3;
      l += bass;
      r += bass;

      left[i] += l * env;
      right[i] += r * env;
    }

    // Sparse bell arpeggio, one octave above the pad, quick decay.
    for (let step = 0; step < 4; step++) {
      const noteT = startT + step * 1.0;
      if (noteT >= DURATION) break;
      const midi = chord.pad[step % chord.pad.length] + 12;
      const freq = midiToFreq(midi);
      const decay = 1.1;
      const s0 = Math.floor(noteT * SR);
      const s1 = Math.min(total, Math.floor((noteT + decay) * SR));
      for (let i = s0; i < s1; i++) {
        const tRel = (i - s0) / SR;
        const env = Math.exp(-tRel * 4.2) * 0.085;
        const p = 2 * Math.PI * freq * (i / SR);
        const v = (Math.sin(p) + Math.sin(p * 2) * 0.25) * env;
        // Pan bells gently alternating for width.
        const pan = step % 2 === 0 ? 0.38 : 0.62;
        left[i] += v * (1 - pan);
        right[i] += v * pan;
      }
    }
  }

  // Master: soft saturation, then peak normalize, then fade in/out.
  let peak = 0;
  for (let i = 0; i < total; i++) {
    left[i] = Math.tanh(left[i] * 0.8);
    right[i] = Math.tanh(right[i] * 0.8);
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  }
  // Bake the "background" level into the file itself rather than relying only
  // on the composition's volume attribute. Worst case (attribute ignored) the
  // bed still sits well under a full-scale voiceover.
  const norm = peak > 0 ? 0.2 / peak : 1;

  const fade = 2.0;
  const fadeS = Math.floor(fade * SR);
  for (let i = 0; i < total; i++) {
    let g = norm;
    if (i < fadeS) g *= i / fadeS;
    const tail = total - i;
    if (tail < fadeS) g *= tail / fadeS;
    left[i] *= g;
    right[i] *= g;
  }

  return { left, right, total };
}

function writeWav(outPath, left, right, total) {
  const bytesPerSample = 2;
  const channels = 2;
  const dataSize = total * channels * bytesPerSample;
  const buf = Buffer.alloc(44 + dataSize);

  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8, 'ascii');
  buf.write('fmt ', 12, 'ascii');
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(channels, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * channels * bytesPerSample, 28);
  buf.writeUInt16LE(channels * bytesPerSample, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(dataSize, 40);

  let o = 44;
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  for (let i = 0; i < total; i++) {
    buf.writeInt16LE(Math.round(clamp(left[i]) * 32767), o);
    o += 2;
    buf.writeInt16LE(Math.round(clamp(right[i]) * 32767), o);
    o += 2;
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
}

const { left, right, total } = render();
writeWav(OUT, left, right, total);
console.log(
  `Wrote ${OUT} — ${DURATION}s, ${SR} Hz stereo 16-bit, ` +
    `${(fs.statSync(OUT).size / 1024 / 1024).toFixed(2)} MB`
);
