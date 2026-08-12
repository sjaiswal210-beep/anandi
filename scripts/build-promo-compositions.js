/**
 * Builds the Anandi Park promo composition for ONE language into
 * anandi-park-promo/index.html.
 *
 * Usage:
 *   node scripts/build-promo-compositions.js hindi     (default)
 *   node scripts/build-promo-compositions.js marathi
 *   node scripts/build-promo-compositions.js english
 *
 * Why one file and not three: `hyperframes check` flags
 * `multiple_root_compositions` when several root-level HTML files carry
 * data-composition-id -- the runtime discovers each as an entry point, which
 * causes duplicate audio playback. That is why the rendered video had broken
 * audio. The language is now a build-time swap: build, render, repeat.
 *
 * Other HyperFrames contract violations fixed versus the original:
 *   1. Background music pointed at a Pixabay CDN URL. Network access at render
 *      time is banned, and that URL now returns 403, so the bed never loaded.
 *      Replaced with a local, license-clean assets/bgm.mp3.
 *   2. Both <audio> elements sat on data-track-index="0" -- same-track overlap.
 *      Voiceover and music now have their own tracks.
 *   3. Voiceover data-duration was 44s; the real files are 40.7-42.0s.
 *   4. gsap.from() carries immediateRender:true, so the "from" state is stamped
 *      on at t=0 even for tweens positioned at t=38. The renderer samples by
 *      seeking, so entrances broke. All converted to fromTo().
 *   5. Scene clips faded out via opacity with no hard visibility kill, so
 *      scenes could bleed into each other. Fades now live on an inner
 *      non-clip layer with a visibility kill at the end of the exit.
 *   6. <br> in body text is banned -- replaced with block elements.
 *   7. The root was unsized and the page background lived on <body>, which the
 *      frame compositor can drop (black frames). Root is sized now, with a
 *      full-bleed background child.
 *   8. Fonts came from the Google Fonts CDN and aliased at render time. Uses
 *      the renderer's bundled Inter directly.
 *   9. Raw "&" in markup -> "&amp;".
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'anandi-park-promo');

// Voiceover durations measured from the WAV headers (scripts/probe-wav.js).
const VARIANTS = {
  hindi: { lang: 'hi', voice: 'voiceover-hindi.wav', voiceDuration: 41.62 },
  marathi: { lang: 'mr', voice: 'voiceover-marathi.wav', voiceDuration: 40.69 },
  english: { lang: 'en', voice: 'voiceover-english.wav', voiceDuration: 42.02 },
};

const DURATION = 45;
const VOICE_START = 0.5;
const FADE = 0.6;

// Scenes overlap by FADE so they genuinely cross-dissolve. Odd scenes sit on
// track 2 and even scenes on track 3, so no two clips share a track at the same
// instant while still allowing that overlap.
const SCENES = [
  { id: 'scene1', start: 0, duration: 8.6, track: 2 },
  { id: 'scene2', start: 8.0, duration: 7.6, track: 3 },
  { id: 'scene3', start: 15.0, duration: 8.6, track: 2 },
  { id: 'scene4', start: 23.0, duration: 8.6, track: 3 },
  { id: 'scene5', start: 31.0, duration: 7.6, track: 2 },
  { id: 'scene6', start: 38.0, duration: 7.0, track: 3 },
];

const sceneById = (id) => SCENES.find((s) => s.id === id);
const round = (n) => +n.toFixed(2);

/**
 * Cross-dissolve for a scene, applied to the inner layer rather than the clip.
 * The clip element's visibility is framework-managed; fading the clip itself
 * trips the scene_layer_missing_visibility_kill lint because a stalled opacity
 * tween can leave two scenes on screen at once. The trailing visibility set is
 * the hard kill.
 */
function sceneFade(id) {
  const s = sceneById(id);
  const layer = `#${id}-layer`;
  const outAt = round(s.start + s.duration - FADE);
  const killAt = round(outAt + FADE);
  return [
    `      tl.set("${layer}", { visibility: "visible" }, ${s.start});`,
    `      tl.fromTo("${layer}", { opacity: 0 }, { opacity: 1, duration: ${FADE}, ease: "power1.inOut" }, ${s.start});`,
    `      tl.to("${layer}", { opacity: 0, duration: ${FADE}, ease: "power1.inOut" }, ${outAt});`,
    `      tl.set("${layer}", { visibility: "hidden" }, ${killAt});`,
  ].join('\n');
}

/**
 * Slow Ken Burns push on a scene background. Transform aliases only
 * (scale / x / y) -- never width/height/top/left.
 */
function kenBurns(id, { fromScale, toScale, fromX = 0, toX = 0, fromY = 0, toY = 0 }) {
  const s = sceneById(id);
  return (
    `      tl.fromTo("#${id} .bg-img", ` +
    `{ scale: ${fromScale}, x: ${fromX}, y: ${fromY} }, ` +
    `{ scale: ${toScale}, x: ${toX}, y: ${toY}, duration: ${s.duration}, ease: "none" }, ${s.start});`
  );
}

const CSS = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; }

      /* Inter is bundled by the renderer. Naming anything else (Segoe UI, Arial,
         DejaVu Sans) gets silently aliased, so preview and render diverge. */
      body { font-family: "Inter", sans-serif; color: #fff; background: #0f172a; }

      /* The root must be an explicitly sized box, otherwise percentage-height
         children collapse and content piles into the top-left corner. */
      #root { position: relative; width: 1920px; height: 1080px; overflow: hidden; }

      /* Full-bleed background child rather than a background on #root itself:
         the frame compositor can drop the root's own background and emit black
         frames even though preview looks correct. */
      .base-bg { position: absolute; inset: 0; background: #0f172a; }

      .clip { position: absolute; inset: 0; width: 1920px; height: 1080px; }

      /* Inner layer carries the cross-dissolve; the clip itself is left alone. */
      .scene-layer { position: absolute; inset: 0; display: flex; align-items: center;
                     justify-content: center; opacity: 0; visibility: hidden; }

      /* Ken Burns needs a clipping wrapper so the scaled image never shows an edge. */
      .bg-wrap { position: absolute; inset: 0; overflow: hidden; }
      .bg-img { display: block; position: absolute; inset: 0; width: 1920px; height: 1080px;
                object-fit: cover; transform-origin: center center; will-change: transform; }
      .overlay { position: absolute; inset: 0; }
      .content { position: relative; z-index: 2; text-align: center; padding: 60px; }

      .badge { display: block; width: max-content; margin: 0 auto 26px;
               background: rgba(245,158,11,0.94); color: #1e293b; font-size: 20px;
               font-weight: 700; padding: 11px 30px; border-radius: 100px; letter-spacing: 1.5px; }
      h1 { font-size: 96px; font-weight: 900; line-height: 1.04; margin-bottom: 22px;
           text-shadow: 0 4px 34px rgba(0,0,0,0.65); }
      h2 { font-size: 58px; font-weight: 700; line-height: 1.2; margin-bottom: 16px; }
      .subtitle { font-size: 32px; color: #e2e8f0; line-height: 1.5; max-width: 1250px; margin: 0 auto; }
      .subtitle-line { display: block; font-size: 32px; color: #e2e8f0; line-height: 1.5; }

      .price { display: block; font-size: 104px; font-weight: 900; color: #fbbf24;
               text-shadow: 0 4px 30px rgba(0,0,0,0.5); }

      .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; max-width: 1480px; }
      .stat { display: block; background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.20);
              border-radius: 22px; padding: 44px 20px; text-align: center; }
      .stat-value { font-size: 54px; font-weight: 900; color: #fbbf24; }
      .stat-label { font-size: 22px; color: #cbd5e1; margin-top: 10px; }

      .connectivity { display: flex; gap: 52px; justify-content: center; flex-wrap: wrap; }
      .conn-item { display: block; text-align: center; }
      .conn-time { font-size: 50px; font-weight: 900; color: #fbbf24; }
      .conn-place { font-size: 22px; color: #e2e8f0; margin-top: 6px; }

      .checklist { list-style: none; }
      .checklist li { display: block; font-size: 30px; line-height: 1.55; color: #e2e8f0;
                      margin-bottom: 18px; }
      .checklist .tick { color: #34d399; font-weight: 700; margin-right: 14px; }

      .cta-box { display: block; background: linear-gradient(135deg, #059669, #047857);
                 border-radius: 26px; padding: 62px 84px; text-align: center;
                 box-shadow: 0 30px 80px rgba(0,0,0,0.45); }
      .cta-box h2 { color: #fff; margin-bottom: 14px; }
      /* Lightened from #fbbf24 to clear WCAG AA 3:1 against the green CTA panel. */
      .cta-phone { display: block; font-size: 50px; font-weight: 900; color: #fccb4c; margin-top: 22px; }
      .cta-foot { display: block; margin-top: 18px; font-size: 24px; color: rgba(255,255,255,0.78); }

      /* Persistent brand mark, fades in once the hero has established. */
      .watermark { position: absolute; top: 54px; left: 66px; z-index: 5; opacity: 0;
                   display: flex; align-items: center; gap: 14px; }
      .wm-dot { display: block; width: 14px; height: 14px; border-radius: 50%; background: #fbbf24; }
      .wm-text { display: block; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;
                 color: rgba(255,255,255,0.95); text-shadow: 0 2px 12px rgba(0,0,0,0.6); }

      /* Progress bar along the bottom edge. */
      .progress { position: absolute; left: 0; bottom: 0; z-index: 6;
                  width: 1920px; height: 6px; background: rgba(255,255,255,0.16); }
      .progress-fill { display: block; width: 1920px; height: 6px;
                       background: linear-gradient(90deg, #fbbf24, #34d399);
                       transform-origin: left center; }
`;

/** One scene: framework-managed clip > inner fading layer > background + content. */
function scene(id, image, overlay, content) {
  const s = sceneById(id);
  return `      <div id="${id}" class="clip" data-start="${s.start}" data-duration="${s.duration}" data-track-index="${s.track}">
        <div id="${id}-layer" class="scene-layer">
          <div class="bg-wrap">
            <!-- Ken Burns deliberately scales the image past the wrapper; the
                 wrapper exists to clip it. Declared so the layout checker does
                 not report it as accidental overflow. -->
            <img id="${id}-bg" class="bg-img" src="assets/${image}" alt="" data-layout-allow-overflow />
          </div>
          <div class="overlay" style="background: ${overlay}"></div>
          <div class="content">
${content}
          </div>
        </div>
      </div>`;
}

function buildBody(v) {
  const voiceDuration = round(Math.min(v.voiceDuration, DURATION - VOICE_START));

  return `      <div class="base-bg"></div>

      <!-- Narration on its own track: two audio clips sharing a track collide. -->
      <audio id="vo" data-start="${VOICE_START}" data-duration="${voiceDuration}" data-track-index="0" data-volume="1" src="assets/${v.voice}"></audio>

      <!-- Music bed, local file. A remote URL breaks deterministic rendering. -->
      <audio id="bgm" data-start="0" data-duration="${DURATION}" data-track-index="1" data-volume="0.45" src="assets/bgm.mp3"></audio>

${scene(
  'scene1',
  'hero-aerial.jpg',
  'linear-gradient(to top, rgba(15,23,42,0.95) 18%, rgba(15,23,42,0.35) 62%, rgba(15,23,42,0.62))',
  `            <span class="badge">RESIDENTIAL PLOTS &middot; PUNE EAST</span>
            <h1>Anandi Park</h1>
            <p class="subtitle">
              <span class="subtitle-line">Premium residential plots at Bakori, Wagholi-Bakori Road</span>
              <span class="subtitle-line">by Yuvraj Gade &amp; Rajan Kute Developers</span>
            </p>`
)}

${scene(
  'scene2',
  'about-land.jpg',
  'linear-gradient(135deg, rgba(15,23,42,0.93), rgba(5,150,105,0.34))',
  `            <p class="subtitle" style="margin-bottom: 22px;">Starting from just</p>
            <span class="price">&#8377;18 Lakh</span>
            <p class="subtitle" style="margin-top: 22px;">All inclusive &middot; 1000 to 4510 sq.ft. &middot; Clear titles</p>`
)}

${scene(
  'scene3',
  'aerial-view.jpg',
  'rgba(15,23,42,0.88)',
  `            <div class="stat-grid">
              <div class="stat"><div class="stat-value">84</div><div class="stat-label">Total Plots</div></div>
              <div class="stat"><div class="stat-value">30 &amp; 40 ft</div><div class="stat-label">Wide Roads</div></div>
              <div class="stat"><div class="stat-value">Gated</div><div class="stat-label">Layout</div></div>
              <div class="stat"><div class="stat-value">Ready</div><div class="stat-label">For Registration</div></div>
            </div>`
)}

${scene(
  'scene4',
  'internal-road.jpg',
  'rgba(15,23,42,0.86)',
  `            <h2 style="margin-bottom: 50px;">Prime Location</h2>
            <div class="connectivity">
              <div class="conn-item"><div class="conn-time">10 min</div><div class="conn-place">Wagheshwar Temple</div></div>
              <div class="conn-item"><div class="conn-time">10 min</div><div class="conn-place">Schools</div></div>
              <div class="conn-item"><div class="conn-time">25 min</div><div class="conn-place">Kharadi IT Hub</div></div>
              <div class="conn-item"><div class="conn-time">30 min</div><div class="conn-place">Pune Airport</div></div>
            </div>`
)}

${scene(
  'scene5',
  'green-belt.jpg',
  'linear-gradient(to right, rgba(15,23,42,0.93) 42%, rgba(15,23,42,0.5))',
  `            <div style="text-align: left; padding-left: 60px;">
              <h2 style="margin-bottom: 40px;">Everything Ready</h2>
              <ul class="checklist">
                <li><span class="tick">&#10003;</span>Landscaped Entry Gate</li>
                <li><span class="tick">&#10003;</span>24&times;7 Water &amp; Electricity</li>
                <li><span class="tick">&#10003;</span>Central Garden &amp; Play Area</li>
                <li><span class="tick">&#10003;</span>Security Cabin &amp; CCTV</li>
                <li><span class="tick">&#10003;</span>Compound Wall &amp; Street Lights</li>
                <li><span class="tick">&#10003;</span>Loan Assistance Available</li>
              </ul>
            </div>`
)}

${scene(
  'scene6',
  'entry-gate.jpg',
  'rgba(15,23,42,0.86)',
  `            <div class="cta-box">
              <h2>Book Your Free Site Visit</h2>
              <p class="subtitle" style="color: rgba(255,255,255,0.88); font-size: 28px;">
                GAT No. 279, Village Bakori, Wagholi-Bakori Road, Pune
              </p>
              <span class="cta-phone">Call Now &middot; anandipark.in</span>
              <span class="cta-foot">Yuvraj Gade &amp; Rajan Kute Developers</span>
            </div>`
)}

      <div class="watermark">
        <span class="wm-dot"></span>
        <span class="wm-text">Anandi Park</span>
      </div>

      <div class="progress"><span class="progress-fill"></span></div>`;
}

/**
 * The single paused timeline. Every entrance uses fromTo() rather than from():
 * from() carries immediateRender:true, so GSAP stamps the "from" values onto the
 * element at t=0 even when the tween sits at t=38. The renderer samples frames
 * by seeking, so from() showed up as missing or flashing entrances.
 */
function buildTimeline() {
  return `      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });

      // Persistent chrome
      tl.fromTo(".progress-fill", { scaleX: 0 }, { scaleX: 1, duration: ${DURATION}, ease: "none" }, 0);
      tl.fromTo(".watermark", { opacity: 0 }, { opacity: 0.92, duration: 0.8, ease: "power1.out" }, 8);

      // ---- Scene 1: Hero ----
${sceneFade('scene1')}
${kenBurns('scene1', { fromScale: 1.0, toScale: 1.14 })}
      tl.fromTo("#scene1 .badge", { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }, 0.55);
      tl.fromTo("#scene1 h1", { y: 70, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: "power3.out" }, 0.85);
      tl.fromTo("#scene1 .subtitle-line", { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.14, ease: "power2.out" }, 1.5);

      // ---- Scene 2: Price ----
${sceneFade('scene2')}
${kenBurns('scene2', { fromScale: 1.12, toScale: 1.0, fromX: 24, toX: -24 })}
      tl.fromTo("#scene2 .content > .subtitle:first-child", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, 8.35);
      tl.fromTo("#scene2 .price", { scale: 0.55, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.85, ease: "back.out(1.6)" }, 8.6);
      tl.fromTo("#scene2 .content > .subtitle:last-child", { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "power2.out" }, 9.45);

      // ---- Scene 3: Stats ----
${sceneFade('scene3')}
${kenBurns('scene3', { fromScale: 1.0, toScale: 1.1, fromY: 12, toY: -12 })}
      tl.fromTo("#scene3 .stat", { y: 46, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 0.62, stagger: 0.18, ease: "power2.out" }, 15.5);

      // ---- Scene 4: Connectivity ----
${sceneFade('scene4')}
${kenBurns('scene4', { fromScale: 1.1, toScale: 1.0, fromX: -20, toX: 20 })}
      tl.fromTo("#scene4 h2", { y: -34, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "power2.out" }, 23.45);
      tl.fromTo("#scene4 .conn-item", { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, stagger: 0.2, ease: "power2.out" }, 24.0);

      // ---- Scene 5: Amenities ----
${sceneFade('scene5')}
${kenBurns('scene5', { fromScale: 1.0, toScale: 1.12, fromX: -16, toX: 16 })}
      tl.fromTo("#scene5 h2", { x: -46, opacity: 0 }, { x: 0, opacity: 1, duration: 0.55, ease: "power2.out" }, 31.45);
      tl.fromTo("#scene5 .checklist li", { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, stagger: 0.13, ease: "power2.out" }, 31.9);

      // ---- Scene 6: CTA ----
${sceneFade('scene6')}
${kenBurns('scene6', { fromScale: 1.08, toScale: 1.0 })}
      tl.fromTo("#scene6 .cta-box", { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(1.3)" }, 38.35);
      tl.fromTo("#scene6 .cta-box .subtitle", { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, 38.95);
      tl.fromTo("#scene6 .cta-phone", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, 39.35);
      tl.fromTo("#scene6 .cta-foot", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.out" }, 39.85);

      window.__timelines["main"] = tl;`;
}

function buildHtml(v) {
  return `<!doctype html>
<html lang="${v.lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <title>Anandi Park &mdash; Residential Plots, Wagholi Pune</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>${CSS}    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DURATION}" data-width="1920" data-height="1080">

${buildBody(v)}

    </div>

    <script>
${buildTimeline()}
    </script>
  </body>
</html>
`;
}

const key = (process.argv[2] || 'hindi').toLowerCase();
const variant = VARIANTS[key];
if (!variant) {
  console.error(
    `Unknown language "${key}". Expected one of: ${Object.keys(VARIANTS).join(', ')}`
  );
  process.exit(1);
}

fs.writeFileSync(path.join(OUT_DIR, 'index.html'), buildHtml(variant));
console.log(
  `Built index.html for ${key} — voice=${variant.voice} ` +
    `(${variant.voiceDuration}s), music=bgm.mp3, duration=${DURATION}s`
);
