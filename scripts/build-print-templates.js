/**
 * Generates print-ready marketing collateral as self-contained HTML files,
 * all from one shared brand design system so they stay consistent.
 *
 * Output: brand/templates/*.html
 * Render: scripts/render-print-templates.js turns each into PDF (vector, for
 *         the printer) + PNG (preview / dashboard) via headless Chrome.
 *
 * Why HTML and not AI image generation: print pieces need pixel-accurate,
 * correct text (phone number, address, prices). AI image models garble text.
 * HTML gives crisp, exact type and true print dimensions with bleed.
 *
 * Each piece declares an @page size so Chrome's print-to-PDF outputs the exact
 * physical dimensions. Bleed is baked into the page size where relevant.
 *
 * Usage: node scripts/build-print-templates.js
 */

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'brand', 'templates');
fs.mkdirSync(DIR, { recursive: true });

const BRAND = {
  company: 'Rich-Land Developers',
  partners: 'Yuvraj Gade & Rajan Kute',
  project: 'Anandi Park',
  tagline: 'Premium Residential Plots',
  sub: 'Bakori · Wagholi-Bakori Road · Pune East',
  phone: '+91 75584 44117',
  web: 'anandipark.in',
  email: 'sales@anandipark.in',
  address: 'GAT No. 279, Village Bakori, Wagholi-Bakori Road, Taluka Haveli, Dist Pune',
  priceFrom: '₹18 Lakh',
};

// Shared palette + primitives. Fonts are loaded from Google Fonts; the render
// script waits for network idle so they're embedded before capture.
const CSS_VARS = `
  :root{
    --slate:#0F172A; --slate2:#1E293B; --gold:#F59E0B; --gold-lt:#FCD34D;
    --gold-dp:#D97706; --emerald:#059669; --white:#ffffff; --muted:#94A3B8;
  }
  *{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  html,body{font-family:'Inter','Segoe UI',sans-serif;color:#fff;}
  .gold{color:var(--gold);}
  .goldgrad{background:linear-gradient(135deg,var(--gold-lt),var(--gold),var(--gold-dp));-webkit-background-clip:text;background-clip:text;color:transparent;}
  .serif{font-family:Georgia,'Times New Roman',serif;}
`;

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">`;

/** Wraps a body in a full HTML doc with the given @page size (for PDF). */
function doc({ title, page, extraCss = '', body }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">${FONTS}
<style>@page{size:${page};margin:0;}${CSS_VARS}${extraCss}</style>
<title>${title}</title></head><body>${body}</body></html>`;
}

const files = {};

// ─────────────────────────────────────────────────────────────
// 1. VISITING CARD — 3.5in x 2in + 0.125in bleed = 3.75 x 2.25 in
// ─────────────────────────────────────────────────────────────
const cardCss = `
  .card{width:3.75in;height:2.25in;position:relative;overflow:hidden;background:var(--slate);}
  .safe{position:absolute;inset:0.125in;}
  .card .accent{position:absolute;top:0;left:0;width:0.22in;height:100%;background:linear-gradient(180deg,var(--gold-lt),var(--gold-dp));}
  .card .logo{height:0.62in;}
  .card .brand{font-size:15pt;font-weight:800;letter-spacing:.3px;}
  .card .brand .rl{color:var(--gold);}
  .card .role{font-size:7.5pt;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-top:2px;}
  .card .rows{position:absolute;bottom:0.16in;left:0.42in;right:0.16in;font-size:8.2pt;line-height:1.5;}
  .card .rows b{color:var(--gold);font-weight:700;}
  .card .proj{position:absolute;top:0.16in;right:0.16in;text-align:right;}
  .card .proj .p{font-size:12pt;font-weight:800;}
  .card .proj .t{font-size:6.5pt;color:var(--muted);letter-spacing:1px;text-transform:uppercase;}
`;
files['visiting-card-front.html'] = doc({
  title: 'Visiting Card — Front', page: '3.75in 2.25in', extraCss: cardCss,
  body: `<div class="card">
    <div class="accent"></div>
    <div class="safe">
      <img class="logo" src="assets/logo.png" alt="">
      <div class="proj"><div class="p">${BRAND.project}</div><div class="t">${BRAND.tagline}</div></div>
      <div class="rows">
        <div style="font-size:12pt;font-weight:800;margin-bottom:2px;">${BRAND.company}</div>
        <div style="color:var(--muted);font-size:7.5pt;letter-spacing:1px;margin-bottom:5px;">${BRAND.partners}</div>
        <div><b>Call</b> &nbsp;${BRAND.phone}</div>
        <div><b>Web</b> &nbsp;${BRAND.web} &nbsp;·&nbsp; <b>Email</b> &nbsp;${BRAND.email}</div>
      </div>
    </div>
  </div>`,
});
files['visiting-card-back.html'] = doc({
  title: 'Visiting Card — Back', page: '3.75in 2.25in', extraCss: cardCss + `
    .back{width:3.75in;height:2.25in;position:relative;overflow:hidden;background:linear-gradient(135deg,var(--slate),var(--slate2));display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}
    .back .bl{height:0.9in;margin-bottom:8px;}
    .back .tag{font-size:9pt;color:var(--gold);letter-spacing:3px;text-transform:uppercase;}
    .back .sub2{font-size:7.5pt;color:var(--muted);margin-top:6px;}`,
  body: `<div class="back">
    <img class="bl" src="assets/logo.png" alt="">
    <div class="tag">${BRAND.tagline}</div>
    <div class="sub2">${BRAND.sub}</div>
    <div class="sub2" style="margin-top:10px;">Starting ${BRAND.priceFrom} · Clear Titles · Gated Layout</div>
  </div>`,
});

// ─────────────────────────────────────────────────────────────
// 2. BROCHURE / BOOK FRONT PAGE — A4 portrait (210 x 297 mm)
// ─────────────────────────────────────────────────────────────
files['brochure-cover.html'] = doc({
  title: 'Brochure / Book Cover — A4', page: 'A4',
  extraCss: `
    .cover{width:210mm;height:297mm;position:relative;overflow:hidden;background:var(--slate);}
    .cover .hero{position:absolute;inset:0;background:url('assets/hero-aerial.jpg') center/cover;}
    .cover .veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,.72),rgba(15,23,42,.35) 45%,rgba(15,23,42,.95));}
    .cover .top{position:absolute;top:16mm;left:0;right:0;display:flex;flex-direction:column;align-items:center;}
    .cover .logo{height:26mm;}
    .cover .co{margin-top:4mm;font-size:15pt;font-weight:700;letter-spacing:.5px;}
    .cover .co .rl{color:var(--gold);}
    .cover .mid{position:absolute;top:120mm;left:0;right:0;text-align:center;padding:0 18mm;}
    .cover .badge{display:inline-block;background:rgba(245,158,11,.92);color:#1e293b;font-size:10pt;font-weight:800;letter-spacing:2px;padding:5px 16px;border-radius:40px;text-transform:uppercase;}
    .cover h1{font-size:52pt;font-weight:900;line-height:1.02;margin-top:10mm;text-shadow:0 4px 30px rgba(0,0,0,.6);}
    .cover .tl{font-size:16pt;color:#e2e8f0;margin-top:6mm;font-weight:500;}
    .cover .price{font-size:22pt;font-weight:900;margin-top:8mm;}
    .cover .strip{position:absolute;bottom:0;left:0;right:0;background:rgba(15,23,42,.9);border-top:2px solid var(--gold);padding:8mm 16mm;display:flex;justify-content:space-between;align-items:center;font-size:11pt;}
    .cover .strip .g{color:var(--gold);font-weight:700;}
  `,
  body: `<div class="cover">
    <div class="hero"></div><div class="veil"></div>
    <div class="top">
      <img class="logo" src="assets/logo.png" alt="">
      <div class="co"><span class="rl">Rich-Land</span> Developers</div>
    </div>
    <div class="mid">
      <span class="badge">Residential Plots · Pune East</span>
      <h1>${BRAND.project}</h1>
      <div class="tl">${BRAND.tagline} at Bakori, Wagholi</div>
      <div class="price goldgrad">Starting ${BRAND.priceFrom}</div>
    </div>
    <div class="strip">
      <span>${BRAND.web}</span>
      <span class="g">${BRAND.phone}</span>
    </div>
  </div>`,
});

// ─────────────────────────────────────────────────────────────
// 3. BROCHURE INSIDE — A4 with features + plot info
// ─────────────────────────────────────────────────────────────
files['brochure-inside.html'] = doc({
  title: 'Brochure Inside — A4', page: 'A4',
  extraCss: `
    .pg{width:210mm;height:297mm;background:#fff;color:#0f172a;position:relative;padding:16mm;}
    .pg h2{font-size:24pt;font-weight:900;color:var(--slate);}
    .pg h2 span{color:var(--gold-dp);}
    .pg .lead{font-size:11pt;color:#475569;margin-top:3mm;line-height:1.6;}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:10mm;}
    .feat{border:1px solid #e2e8f0;border-radius:10px;padding:6mm;}
    .feat .h{font-size:12pt;font-weight:800;color:var(--slate);}
    .feat .d{font-size:9.5pt;color:#64748b;margin-top:2mm;line-height:1.5;}
    .imgs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm;margin-top:8mm;}
    .imgs img{width:100%;height:38mm;object-fit:cover;border-radius:8px;}
    .foot{position:absolute;bottom:12mm;left:16mm;right:16mm;border-top:2px solid var(--gold);padding-top:5mm;display:flex;justify-content:space-between;font-size:10pt;color:var(--slate);}
    .foot b{color:var(--gold-dp);}
  `,
  body: `<div class="pg">
    <h2>Why <span>${BRAND.project}</span></h2>
    <div class="lead">84 premium residential plots (1000–4510 sq.ft.) with clear, marketable titles on the Wagholi-Bakori Road, Pune East growth corridor.</div>
    <div class="grid">
      <div class="feat"><div class="h">Clear, Marketable Titles</div><div class="d">Ready for immediate registration and construction.</div></div>
      <div class="feat"><div class="h">Gated, Planned Layout</div><div class="d">30 &amp; 40 ft internal roads, compound wall, street lighting, landscaped entry.</div></div>
      <div class="feat"><div class="h">Prime Connectivity</div><div class="d">Kharadi IT hub 25 min · Airport 30 min · Schools &amp; temple 10 min.</div></div>
      <div class="feat"><div class="h">Loan &amp; EMI Support</div><div class="d">Tie-ups with SBI, HDFC, ICICI, Axis. Book at just 10%.</div></div>
    </div>
    <div class="imgs">
      <img src="assets/aerial-view.jpg"><img src="assets/internal-road.jpg"><img src="assets/green-belt.jpg">
    </div>
    <div class="foot"><span>${BRAND.company} · ${BRAND.partners}</span><span><b>${BRAND.phone}</b> · ${BRAND.web}</span></div>
  </div>`,
});

// ─────────────────────────────────────────────────────────────
// 4. FLEX BANNER — portrait 4ft x 6ft (ratio 2:3). Rendered large.
// ─────────────────────────────────────────────────────────────
files['flex-portrait.html'] = doc({
  title: 'Flex Banner — Portrait 4x6ft', page: '4in 6in',
  extraCss: `
    .flex{width:4in;height:6in;position:relative;overflow:hidden;background:var(--slate);}
    .flex .bg{position:absolute;inset:0;background:url('assets/aerial-view.jpg') center/cover;}
    .flex .veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,.8),rgba(15,23,42,.45) 40%,rgba(15,23,42,.96));}
    .flex .in{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;text-align:center;padding:0.4in;}
    .flex .logo{height:1.1in;margin-top:0.2in;}
    .flex .co{font-size:15pt;font-weight:700;margin-top:0.12in;}
    .flex .co .rl{color:var(--gold);}
    .flex .badge{margin-top:auto;display:inline-block;background:rgba(245,158,11,.95);color:#1e293b;font-size:11pt;font-weight:800;letter-spacing:2px;padding:6px 16px;border-radius:40px;text-transform:uppercase;}
    .flex h1{font-size:54pt;font-weight:900;line-height:1;margin-top:0.18in;}
    .flex .tl{font-size:15pt;color:#e2e8f0;margin-top:0.14in;}
    .flex .price{font-size:30pt;font-weight:900;margin-top:0.2in;}
    .flex .cta{margin-top:auto;width:100%;background:var(--gold);color:#0f172a;border-radius:12px;padding:0.16in;font-size:16pt;font-weight:900;}
    .flex .cta small{display:block;font-size:9pt;font-weight:600;color:#1e293b;letter-spacing:1px;}
  `,
  body: `<div class="flex">
    <div class="bg"></div><div class="veil"></div>
    <div class="in">
      <img class="logo" src="assets/logo.png" alt="">
      <div class="co"><span class="rl">Rich-Land</span> Developers</div>
      <span class="badge">Residential Plots</span>
      <h1>${BRAND.project}</h1>
      <div class="tl">Bakori, Wagholi · Pune East</div>
      <div class="price goldgrad">From ${BRAND.priceFrom}</div>
      <div class="cta">${BRAND.phone}<small>BOOK YOUR FREE SITE VISIT · ${BRAND.web}</small></div>
    </div>
  </div>`,
});

// ─────────────────────────────────────────────────────────────
// 5. HOARDING — landscape 12ft x 6ft (ratio 2:1)
// ─────────────────────────────────────────────────────────────
files['flex-hoarding.html'] = doc({
  title: 'Hoarding — Landscape 12x6ft', page: '12in 6in',
  extraCss: `
    .h{width:12in;height:6in;position:relative;overflow:hidden;background:var(--slate);}
    .h .bg{position:absolute;inset:0;background:url('assets/hero-aerial.jpg') center/cover;}
    .h .veil{position:absolute;inset:0;background:linear-gradient(90deg,rgba(15,23,42,.94) 38%,rgba(15,23,42,.4));}
    .h .in{position:absolute;inset:0;padding:0.7in;display:flex;flex-direction:column;justify-content:center;max-width:7.4in;}
    .h .logo{height:1.1in;}
    .h .co{font-size:18pt;font-weight:700;margin-top:0.14in;}
    .h .co .rl{color:var(--gold);}
    .h h1{font-size:74pt;font-weight:900;line-height:.98;margin-top:0.2in;}
    .h .tl{font-size:20pt;color:#e2e8f0;margin-top:0.14in;}
    .h .price{font-size:40pt;font-weight:900;margin-top:0.16in;}
    .h .cta{position:absolute;right:0.7in;bottom:0.7in;background:var(--gold);color:#0f172a;border-radius:14px;padding:0.2in 0.34in;text-align:center;}
    .h .cta .n{font-size:26pt;font-weight:900;}
    .h .cta .s{font-size:11pt;font-weight:700;letter-spacing:1px;}
  `,
  body: `<div class="h">
    <div class="bg"></div><div class="veil"></div>
    <div class="in">
      <img class="logo" src="assets/logo.png" alt="">
      <div class="co"><span class="rl">Rich-Land</span> Developers</div>
      <h1>${BRAND.project}</h1>
      <div class="tl">Premium Residential Plots · Bakori, Wagholi</div>
      <div class="price goldgrad">Starting ${BRAND.priceFrom}</div>
    </div>
    <div class="cta"><div class="n">${BRAND.phone}</div><div class="s">BOOK A FREE SITE VISIT · ${BRAND.web}</div></div>
  </div>`,
});

// ─────────────────────────────────────────────────────────────
// 6. CARRY BAG — 12in x 15in front panel
// ─────────────────────────────────────────────────────────────
files['carry-bag.html'] = doc({
  title: 'Carry Bag — 12x15in', page: '12in 15in',
  extraCss: `
    .bag{width:12in;height:15in;position:relative;overflow:hidden;background:linear-gradient(160deg,var(--slate),var(--slate2));display:flex;flex-direction:column;align-items:center;text-align:center;padding:1.4in 1in;}
    .bag .logo{height:2.2in;}
    .bag .co{font-size:30pt;font-weight:800;margin-top:0.4in;}
    .bag .co .rl{color:var(--gold);}
    .bag .rule{width:2.2in;height:3px;background:var(--gold);margin:0.4in 0;}
    .bag h1{font-size:58pt;font-weight:900;margin-top:0.2in;}
    .bag .tl{font-size:20pt;color:var(--muted);letter-spacing:3px;text-transform:uppercase;margin-top:0.2in;}
    .bag .foot{margin-top:auto;font-size:18pt;color:#e2e8f0;}
    .bag .foot .g{color:var(--gold);font-weight:800;}
  `,
  body: `<div class="bag">
    <img class="logo" src="assets/logo.png" alt="">
    <div class="co"><span class="rl">Rich-Land</span> Developers</div>
    <div class="rule"></div>
    <h1>${BRAND.project}</h1>
    <div class="tl">${BRAND.tagline}</div>
    <div class="foot"><span class="g">${BRAND.phone}</span> &nbsp;·&nbsp; ${BRAND.web}</div>
  </div>`,
});

// ─────────────────────────────────────────────────────────────
// 7. LETTERHEAD — A4
// ─────────────────────────────────────────────────────────────
files['letterhead.html'] = doc({
  title: 'Letterhead — A4', page: 'A4',
  extraCss: `
    .lh{width:210mm;height:297mm;background:#fff;color:#0f172a;position:relative;}
    .lh .top{display:flex;align-items:center;justify-content:space-between;padding:14mm 18mm;border-bottom:3px solid var(--gold);}
    .lh .brand{display:flex;align-items:center;gap:8mm;}
    .lh .brand img{height:20mm;}
    .lh .brand .n{font-size:17pt;font-weight:800;color:var(--slate);}
    .lh .brand .n .rl{color:var(--gold-dp);}
    .lh .brand .p{font-size:9pt;color:#64748b;letter-spacing:1px;}
    .lh .cinfo{text-align:right;font-size:9pt;color:#475569;line-height:1.6;}
    .lh .cinfo b{color:var(--gold-dp);}
    .lh .body{padding:16mm 18mm;font-size:11pt;color:#334155;}
    .lh .foot{position:absolute;bottom:0;left:0;right:0;background:var(--slate);color:#cbd5e1;font-size:8.5pt;padding:6mm 18mm;display:flex;justify-content:space-between;}
    .lh .foot .g{color:var(--gold);}
  `,
  body: `<div class="lh">
    <div class="top">
      <div class="brand"><img src="assets/logo-white.png" alt="">
        <div><div class="n"><span class="rl">Rich-Land</span> Developers</div><div class="p">${BRAND.partners}</div></div>
      </div>
      <div class="cinfo"><b>${BRAND.phone}</b><br>${BRAND.web}<br>${BRAND.email}</div>
    </div>
    <div class="body">
      <p style="color:#94a3b8;">Date: __________________</p>
      <p style="margin-top:14mm;">Dear _______________,</p>
      <p style="margin-top:8mm;line-height:1.9;">&nbsp;</p>
    </div>
    <div class="foot"><span>${BRAND.address}</span><span class="g">${BRAND.project}</span></div>
  </div>`,
});

let n = 0;
for (const [name, html] of Object.entries(files)) {
  fs.writeFileSync(path.join(DIR, name), html);
  console.log('wrote', name);
  n++;
}
console.log(`\n${n} print templates written to brand/templates/`);
