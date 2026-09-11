# Anandi Park — Feature State & Architecture Notes

Companion to `HANDOFF.md`. This is the detailed map of what exists, where it
lives, and what's done vs pending. Written for the next agent.

---

## Project facts (do not get these wrong)

- Developer / company: **Rich-Land Developers** (partners **Yuvraj Gade & Rajan Kute**).
  Display as "Rich-Land Developers" with "by Yuvraj Gade & Rajan Kute" where useful.
- Contact number: **+91 75584 44117** (WhatsApp `917558444117`).
- Logo assets: `apps/web/public/rich-land-logo.svg` (horizontal), `rich-land-mark.svg` (icon).
- Product is **"residential plots"** — never "NA plots".
- **NO RERA registration** — never claim it anywhere (site, bot, ads, captions).
- Price is **₹18 Lakh+** (not ₹15 Lakh).
- Location: **Bakori, Wagholi, Pune East**.
- 84 plots, 1000–4510 sq.ft.
- WhatsApp bot persona: **Priya**, polite female, Hinglish by default (Marathi if
  the customer writes Marathi), no greeting in every message, proactive about
  loan/EMI without waiting for a money objection.
- Dashboard is private (password `Kalpdev@1994`); `/project` is the public site.
- Admin login: `Kalpdev@outlook.com` / `Kalpdev@1234`.
- Hardcoded workspace ID: `cmsai8kh50001rapl8ioxehxe`.
- Brand/company: **Rich-Land Developers** (Yuvraj Gade & Rajan Kute). Contact
  **+91 75584 44117**. Colors: slate `#0F172A`, gold `#F59E0B`, emerald `#059669`.

---

## Branding + Marketing Kit — DONE (flex needs more design iteration)
- Logo master `brand/richlandlogo-master.png`; HD kit via `scripts/build-brand-kit.js`.
- Print templates (`brand/templates/`) → `scripts/render-print-templates.js`:
  visiting card, brochure cover/inside, flex portrait, hoarding, carry bag, letterhead.
- **40x40 ft Marathi ground flex** — `brand/dist/flex-final/anandi-park-flex-40x40-final.pdf`.
  The source artwork was supplied as a PDF (`../Anandi_Park_40x40ft_UltraHD_Print-2.pdf`);
  extracted with `scripts/extract-pdf-a85.js` → `brand/dist/flex-final/flex-source.png`,
  then edited by `scripts/replace-flex-qr.js`: real scannable WhatsApp QR
  (`wa.me/917558444117?text=Hi- Send more information`), "+91" removed, QR enlarged,
  Marathi caption block replaced with "SCAN NOW". **User still wants further changes**
  — rebuild with `node scripts/replace-flex-qr.js` (deps: `npm i qrcode@1.5.4 jsqr@1.4.0
  --no-save`; needs ffmpeg + Chrome). Pixel geometry is measured in the script; use
  `scripts/probe-flex-panel.js` / `inspect-png.js` to re-measure after any layout change.
- **AI video ad packages** in `brand/ad-campaign/` (TOW SOP): hero "Land vs Flat",
  UGC talking-head, family/couple, multi-lang VO. Marathi VO audio generated via
  `scripts/generate-ad-vo-marathi.js` → `brand/ad-campaign/audio/marathi/`.
- All downloadable on the dashboard at `/marketing-kit`.
- `brand/dist/` is gitignored (rebuildable); masters, SVGs, templates, scripts,
  web-servable PDFs/previews, and the extracted flex source are committed.

---

## Feature status

### Public website — DONE
- Path: `apps/web/src/app/(site)/` + `apps/web/src/components/site/`.
- Content in `site-data.ts`. Corrected pricing, sizes, connectivity, no RERA/NA.
- Root `/` redirects to `/project`.
- SEO: full metadata + OG/Twitter + JSON-LD in `(site)/layout.tsx`; `robots.txt`
  and `sitemap.xml` in `apps/web/public/`. Google Search Console verified +
  indexed (verification file `public/google7721b779ee3afbac.html`).

### Entry lead-capture popup — DONE
- `apps/web/src/components/site/lead-popup.tsx`, mounted in `(site)/layout.tsx`.
- Shows 2.5s after load, once per session, never again after a submit.
- Submits to `POST /website/public/anandi-park/inquiry`.
- Shared API/URL/phone helpers in `site-api.ts` (also used by `contact.tsx`).

### Lead capture → WhatsApp — DONE (delivery pending session link)
- `apps/api/src/modules/website/website.service.ts` `submitInquiry()` creates the
  lead and fires `startWhatsAppFlow()` (fire-and-forget) which sends Priya's
  opening message and records it so the bot doesn't greet twice.
- Inbound WhatsApp from a NEW number auto-creates a `WHATSAPP` lead (see
  `whatsapp-bot.service.ts handleIncomingMessage`), tagged `ctwa-ad` when the
  text looks like a Click-to-WhatsApp ad referral.

### WhatsApp bot (Priya) — DONE
- `apps/api/src/modules/whatsapp-bot/whatsapp-bot.service.ts`.
- Gemini `gemini-flash-latest`, `maxOutputTokens: 2048`, persists both directions,
  language matching, financial advisory (appreciation estimates, EMI, honest tax).
- Delivery via a separate WhatsApp bridge on the VPS (`VPS_WHATSAPP_URL`, 8300).
  **Session must be QR-linked for messages to actually send.**

### Social content generation — DONE
- `apps/api/src/modules/social-media/social-media.service.ts` (captions/hashtags
  via Gemini) + `social-image.service.ts` (ad images via `gemini-3.1-flash-image`,
  Pollinations fallback). ~23 posts already generated.
- **Rich-Land logo overlay (added):** every generated ad image is composited
  with the Rich-Land logo (bottom-right, ~18% width) via `sharp` in
  `social-image.service.ts` `overlayLogo()`, applied in both the Gemini and
  Pollinations paths. Logo asset bundled at
  `apps/api/src/modules/social-media/assets/richland-logo.png` and copied into
  `dist` via `nest-cli.json` assets. Never breaks generation (falls back to the
  raw image on any error).
- **Prompt targets Pune plot buyers/investors (updated):** `buildAdPrompt()`
  now says "residential plots" (never "NA plots"), prices from ₹18 Lakh+, Pune
  East, audience = Pune families & investors buying a plot for a home or
  investment.

### Facebook + Instagram auto-publish — DONE (needs token in env)
- `apps/api/src/modules/social-media/meta-publish.service.ts`.
- FB: `POST /{page}/photos`. IG: create container → poll FINISHED → media_publish.
- **Token handling:** the configured `META_PAGE_ACCESS_TOKEN` may be a System
  User token; the service exchanges it for a Page token at runtime via
  `GET /{page-id}?fields=access_token` and caches it. This is why publishing
  works with a non-expiring System User token.
- Diagnostics: `GET /social-media/publish-diagnostics`.

### Meta Lead Ads + comments — DONE (needs token + a lead form)
- `apps/api/src/modules/lead-ingestion/`. Polls lead forms (no webhook needed),
  dedups on `leadgen_id`. Also exchanges system-user → page token.
- Diagnostics: `GET /meta/diagnostics`.

### Ads & Costs dashboard — DONE (Meta sync + ad CREATION now built)
- `apps/api/src/modules/ads/`. Reuses the `Campaign` table. Meta spend sync via
  Graph API; manual entry for Google/other. CPL/CTR/CPC computed.
- **Programmatic Meta ad creation (added).** `createMetaCampaign()` builds the
  full Marketing API chain Campaign → Ad Set → Ad Creative → Ad, **always
  created PAUSED** (launch manually via the ▶ toggle → `setMetaStatus` ACTIVE).
  Endpoint `POST /ads/meta/create` (DTO `create-meta-campaign.dto.ts`).
- **Four ad types** via one `adType` param — each sets a different objective /
  placement / destination / CTA (all through the same Meta API):
  - `facebook` — lead ad, Facebook placement, LEAD_GENERATION
  - `instagram` — lead ad, Instagram placement, LEAD_GENERATION
  - `whatsapp` — Click-to-WhatsApp (OUTCOME_ENGAGEMENT, CONVERSATIONS,
    `WHATSAPP_MESSAGE` CTA, `promoted_object.whatsapp_phone_number`)
  - `website` — traffic to the site (OUTCOME_TRAFFIC, LANDING_PAGE_VIEWS)
- **Targeting = Pune** (city key `2295423` + custom radius, default 30 km, min 24).
  ⚠ Real-estate ads MUST set `special_ad_categories: ['HOUSING']` (mandatory;
  Meta rejects otherwise). Housing FORBIDS age/gender/interest targeting — so the
  "plot buyers / investors" audience is reached via geo + creative/copy +
  lead-gen optimization, NOT interest filters. This is Meta policy, not a code
  limit.
- **Capability check:** `GET /ads/meta/capabilities` (public, read-only, spends
  nothing) — reports account status, funding, and granted token permissions.
  RUN THIS ON PRODUCTION before launching, to confirm `ads_management`.
- Dashboard: "Create Meta Ad" form with ad-type selector, AI "Generate" creative
  (logo'd), preview, and a per-campaign Launch/Pause toggle that calls the real
  Meta status API for Meta campaigns.
- **Google Ads: still manual only.** No API integration — the Google Ads API
  needs a developer token (weeks of Google approval). Track Google spend via
  "Add Campaign / Cost". Everything else is launchable from the dashboard.
- Image note: `imageUrl` may be a full https URL or a relative `/uploads/...`
  path (resolved against `API_PUBLIC_URL`). Meta fetches images server-side, so
  it must be a PUBLIC https URL — localhost images won't work; production does.

### Voice calls (Vobiz + Sarvam TTS) — DONE
- `apps/api/src/modules/ai-calling/`. `answer_url` must be GET; needs HTTPS
  (nginx). Ready scripts + custom text with Sarvam voice generation.
- Pre-recorded audio files may still say "RERA registered" — use Custom Text.

### Staff Attendance / HR — DONE (came from GitHub; runtime bits to verify)
- API module `apps/api/src/modules/hr/` (`hr.controller.ts`, `hr.service.ts`,
  `hr-cron.service.ts`). Routes under `/api/v1/hr/*`: employees CRUD,
  attendance QR (`/attendance/qr`), scan/punch (`/attendance/scan`), logs,
  WhatsApp report triggers (`/attendance/trigger-checkin-report`,
  `/trigger-checkout-report`), leaves (+approve), payroll (calculate + pay),
  worker-portal.
- DB models in `packages/database/prisma/schema.prisma`: `Employee`,
  `Attendance` (GPS `checkInLocation/checkOutLocation` "lat,lng", base64
  `photoIn/photoOut`, `@@unique([employeeId,date])`), `Leave`, `Payroll`,
  `AttendanceToken` (rotating wall-QR tokens). Tables already exist in Neon.
- Web: dashboard admin at `/plotting/hr` (sidebar "Team & HR"); public site
  routes `(site)/attendance/scan` (mobile GPS + selfie punch),
  `(site)/worker-portal`, `(site)/hr-terminal` (wall QR). Spec/marketing page at
  `apps/web/public/features.html`.
- **Runtime items to verify on the VPS:**
  - `puppeteer` (added dep) may need its Chromium downloaded
    (`npx puppeteer browsers install chrome`) if QR/PDF generation errors.
  - WhatsApp daily reports (11 AM check-in / 7 PM check-out to +91 73507 85606)
    only deliver if the WhatsApp bridge session is QR-linked (see open item #1).

### Plot inventory map — IN PROGRESS
- `apps/web/src/app/(dashboard)/plotting/inventory/page.tsx`. Engineering-drawing
  style SVG (white bg, outlined blocks, zoom/pan/click). User last iterating on look.

### Promo video (HyperFrames) — DONE
- `anandi-park-promo/`. Single `index.html` built per language by
  `scripts/build-promo-compositions.js hindi|marathi|english`.
- Audio: Sarvam voiceovers (`assets/voiceover-*.wav`) + local synthesized
  `assets/bgm.mp3` (from `scripts/generate-bgm.js`). Verified with
  `scripts/verify-video-audio.js`. Renders to `anandi-park-promo/renders/`.
- Players on the Social page pull from `/uploads/video/*.mp4` (copy renders there).

### Lead scraper — DONE (limited by reality)
- `scripts/real-scraper.js` + `apps/api/.../lead-scraper`. Google Maps business
  contacts only; buyer leads realistically come from Meta ads, not scraping.

---

## Important gotchas learned the hard way

1. **Dashboard shows zeros:** two separate causes, both fixed —
   (a) web build baked `NEXT_PUBLIC_API_URL=http://IP:4000` → mixed content on
   HTTPS domain. Leave that env unset; the client resolves the URL at runtime
   (`apps/web/src/lib/api.ts`). (b) JWT expires in 24h and the old code trusted a
   stale localStorage token forever. Layout now logs in fresh on every load and
   clears the token on 401.
2. **Next.js prod build fails on lint errors** (not warnings). Empty `catch {}`
   trips `no-empty` — put a comment inside.
3. **`git pull` doesn't update the web frontend** — you must `npx next build`.
4. **PowerShell:** `&&` is invalid, use `;`. Paths with `(dashboard)` need quotes.
5. **Meta needs a Page token, not a user/system-user token directly** for
   publishing and lead forms — the services do the exchange automatically.
6. **HyperFrames:** one root `index.html` only. Multiple root files with the same
   `data-composition-id` caused duplicate/broken audio. Node ≥22, ffmpeg required.

---

## Useful scripts (`scripts/`)

| Script | Purpose |
| --- | --- |
| `build-promo-compositions.js <lang>` | Build the promo `index.html` for a language |
| `generate-bgm.js` | Synthesize the royalty-free music bed |
| `verify-video-audio.js <mp4>` | Confirm a render has narration + music |
| `generate-site-images.js` | AI site images (Gemini → Pollinations fallback) |
| `reset-data.ts` | Purge dummy data (dry-run default, `--confirm` to apply) |
| `real-scraper.js` | Google Maps lead scraper |
| `poll-meta-leads.js` | Cron entry to pull Meta Lead Ads |

Env-heavy scripts read the root `.env`.

---

## API quick reference (base: `https://api.anandipark.in/api/v1`)

| Endpoint | Notes |
| --- | --- |
| `POST /auth/login` | `{email,password}` → `data.accessToken` (24h JWT) |
| `GET /dashboard/live-stats` | leads/plots/channels (needs auth + `X-Workspace-Id`) |
| `POST /website/public/anandi-park/inquiry` | public lead capture |
| `POST /social-media/generate` | caption + image |
| `POST /social-media/:id/publish` | publish to FB/IG |
| `GET /social-media/publish-diagnostics` | Meta publish config (public) |
| `GET /meta/diagnostics` | Meta lead config (public) |
| `GET /whatsapp-bot/vps/health` / `.../status` | WhatsApp bridge state |

All authed endpoints need `Authorization: Bearer <token>` and
`X-Workspace-Id: cmsai8kh50001rapl8ioxehxe`.
