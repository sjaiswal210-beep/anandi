/**
 * Verifies a rendered promo actually contains audio, and that both layers are
 * present: narration where it should be, music bed where narration is absent.
 *
 * Usage: node scripts/verify-video-audio.js <video.mp4>
 */

const { execFileSync } = require('child_process');
const fs = require('fs');

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error(`Usage: node scripts/verify-video-audio.js <video.mp4>`);
  process.exit(1);
}

function probeStreams() {
  const out = execFileSync(
    'ffprobe',
    [
      '-v', 'error',
      '-show_entries', 'stream=index,codec_type,codec_name,channels,sample_rate',
      '-of', 'json',
      file,
    ],
    { encoding: 'utf8' }
  );
  return JSON.parse(out).streams;
}

/** Mean/peak dBFS for a time window. volumedetect reports on stderr at info level. */
function loudness(start, dur) {
  let stderr = '';
  try {
    execFileSync(
      'ffmpeg',
      ['-hide_banner', '-ss', String(start), '-t', String(dur), '-i', file,
       '-af', 'volumedetect', '-f', 'null', '-'],
      { encoding: 'utf8', stdio: ['ignore', 'ignore', 'pipe'] }
    );
  } catch (e) {
    stderr = (e.stderr || '').toString();
  }
  // ffmpeg exits 0 here, so the output arrives via the thrown-or-not stderr pipe.
  if (!stderr) {
    const r = require('child_process').spawnSync(
      'ffmpeg',
      ['-hide_banner', '-ss', String(start), '-t', String(dur), '-i', file,
       '-af', 'volumedetect', '-f', 'null', '-'],
      { encoding: 'utf8' }
    );
    stderr = r.stderr || '';
  }
  const mean = /mean_volume:\s*(-?[\d.]+|-inf)/.exec(stderr);
  const peak = /max_volume:\s*(-?[\d.]+|-inf)/.exec(stderr);
  return {
    mean: mean ? mean[1] : 'n/a',
    peak: peak ? peak[1] : 'n/a',
  };
}

const streams = probeStreams();
const audio = streams.filter((s) => s.codec_type === 'audio');
const video = streams.filter((s) => s.codec_type === 'video');

console.log(`File: ${file}`);
console.log(`  video streams: ${video.length} (${video.map((v) => v.codec_name).join(', ') || 'none'})`);
console.log(`  audio streams: ${audio.length} (${audio.map((a) => `${a.codec_name} ${a.sample_rate}Hz ${a.channels}ch`).join(', ') || 'NONE'})`);

if (audio.length === 0) {
  console.error('\nFAIL: no audio stream in the rendered file.');
  process.exit(1);
}

const windows = [
  { start: 0.0, dur: 0.45, label: 'music bed only (before narration)' },
  { start: 3.0, dur: 5.0, label: 'narration + music' },
  { start: 20.0, dur: 5.0, label: 'narration + music' },
  { start: 38.0, dur: 3.0, label: 'narration + music' },
  { start: 43.0, dur: 1.8, label: 'music bed only (after narration)' },
];

console.log('\n  window            mean dB    peak dB   expectation');
let silentWindows = 0;
const rows = [];
for (const w of windows) {
  const { mean, peak } = loudness(w.start, w.dur);
  if (mean === '-inf') silentWindows++;
  rows.push({ ...w, mean: Number(mean), peak: Number(peak) });
  console.log(
    `  ${String(w.start).padStart(5)}s +${String(w.dur).padEnd(4)}  ` +
      `${String(mean).padStart(8)}  ${String(peak).padStart(8)}   ${w.label}`
  );
}

const bedOnly = rows.filter((r) => r.label.startsWith('music bed'));
const withVoice = rows.filter((r) => r.label.startsWith('narration'));
const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

const bedMean = avg(bedOnly.map((r) => r.mean));
const voiceMean = avg(withVoice.map((r) => r.mean));

console.log('');
if (silentWindows > 0) {
  console.error(`FAIL: ${silentWindows} window(s) are digitally silent.`);
  process.exit(1);
}
console.log(`  music-bed-only mean : ${bedMean.toFixed(1)} dB`);
console.log(`  narration mean      : ${voiceMean.toFixed(1)} dB`);
console.log(`  separation          : ${(bedMean - voiceMean).toFixed(1)} dB (bed should be quieter)`);

if (voiceMean <= bedMean) {
  console.error('\nFAIL: narration sections are not louder than music-only sections.');
  console.error('Either the voiceover is missing or the music bed is too loud.');
  process.exit(1);
}

console.log('\nPASS: audio present, both layers detected, narration sits above the bed.');
