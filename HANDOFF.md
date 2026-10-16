# Anandi Park — Project Handoff

This is the single source of truth for picking the project up on a new machine
with a new agent. Read this file first, then `PROJECT_STATE.md` for the detailed
feature status.

---

## 1. What this project is

**Anandi Park** — a marketing + CRM system for selling **84 residential plots**
by **Rich-Land Developers** (partners **Yuvraj Gade & Rajan Kute**) at GAT No. 279,
Village Bakori, Wagholi-Bakori Road, Taluka Haveli, Dist Pune.
Contact: **+91 80071 07799** (WhatsApp `918007107799`).

> ⚠️ **The business number was changed to +91 8007107799** (the WhatsApp-ads
> number). The old number `+91 75584 44117` is retired. It's env-driven
> (`WHATSAPP_BUSINESS_NUMBER`), used across site, dashboard, bot, AI and ads.
> Some older brand/flex assets below still reference the old number — regenerate
> them if you reprint.

It is a Turborepo monorepo (originally a generic "RealtyOS" CRM) that has been
heavily customised into a single-project app for Anandi Park.

| Piece | Stack | Port (dev) |
| --- | --- | --- |
| `apps/api` | NestJS + Prisma | 4000 |
| `apps/web` | Next.js 15 + React 19 + Tailwind | 3000 |
| `apps/worker` | BullMQ worker (optional) | — |
| `packages/database` | Prisma schema + client | — |
| `packages/shared` | Shared types/validators | — |
| `anandi-park-promo` | HyperFrames promo video project | — |

---

## 2. Live environment (already deployed)

| Thing | Value |
| --- | --- |
| Public site | https://anandipark.in → full `/project` site; **ad clicks** (fbclid/gclid/utm/ad) → `/offer` lead form |
| Dashboard | https://anandipark.in/dashboard (password gate: `Kalpdev@1994`) |
| API | https://api.anandipark.in |
| GitHub | https://github.com/sjaiswal210-beep/anandi (⚠ PUBLIC) |
| VPS | `147.93.169.183` (Contabo, Ubuntu 22.04), app at `/opt/anandi-park/anandi` |
| DB | Neon PostgreSQL (cloud, connection string in VPS `.env`) |
| Process mgr | PM2: `anandi-api`, `anandi-web`, `anandi-deploy` |
| Web server | nginx + certbot (HTTPS on all three subdomains) |

**Current DB state (approx):** ~76 leads, 84 plots (all AVAILABLE), 8 calls,
~23 social posts. All real; dummy data was purged.

---

## 3. First-time setup on the NEW laptop

> The zip will NOT include `node_modules` or `.env` files (see section 5). You
> reinstall dependencies and recreate `.env` from the templates.

```bash
# 1. Node 22+ required (HyperFrames video needs it; the apps run on 20+ too).
node --version

# 2. Install all workspace dependencies from the repo root.
npm install

# 3. Recreate the environment files (see section 4). At minimum apps/api needs one.
#    Copy .env.example to .env and fill in the real values (kept separately/securely).
cp .env.example .env
#    Also create apps/api/.env and apps/web/.env.local if they were used — see section 4.

# 4. Generate the Prisma client against the schema.
npm run db:generate

# 5. Run the apps (from repo root; turbo starts api + web).
npm run dev
```

The database is **Neon cloud** — you do NOT need local Postgres or Docker. Just
point `DATABASE_URL` at the Neon string.

---

## 4. Environment variables

`.env` files are gitignored and are NOT in the zip. Recreate them. The real
values are held separately (ask the project owner / see the secure note).

**Where env files live and are read:**
- Root `.env` — used by scripts and some tooling.
- The API reads env via `@nestjs/config` (root `.env` on the VPS is what's used
  in production). On the VPS the single `/opt/anandi-park/anandi/.env` holds
  everything.

**Keys currently in use** (names only — fill real values):

```
# Core
NODE_ENV=production
APP_URL=https://anandipark.in
API_URL=https://api.anandipark.in
DATABASE_URL=<Neon postgres url>
JWT_SECRET=<random secret>
JWT_EXPIRATION=24h

# AI
GEMINI_API_KEY=<google ai studio key, billing enabled>
GEMINI_MODEL=gemini-flash-latest          # text
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image  # images (optional override)
AI_PROVIDER=gemini
OPENAI_API_KEY=<optional>

# Meta (Facebook + Instagram publish, ads, lead ads)
META_PAGE_ID=1190123837525578
META_IG_USER_ID=17841436055562071
META_AD_ACCOUNT_ID=act_1393094840853010
META_PAGE_ACCESS_TOKEN=<SYSTEM USER token, non-expiring>
META_VERIFY_TOKEN=anandi-park-meta-verify

# WhatsApp bridge (runs separately on the VPS, port 8300)
VPS_WHATSAPP_URL=http://127.0.0.1:8300
VPS_WHATSAPP_SECRET=<secret>
VPS_WHATSAPP_BIZ_ID=anandi-park

# Telephony (Vobiz) + TTS (Sarvam)
VOBIZ_AUTH_ID=<...>
VOBIZ_AUTH_TOKEN=<...>
VOBIZ_FROM_NUMBER=+91XXXXXXXXXX
VOBIZ_CALLBACK_URL=https://api.anandipark.in
SARVAM_API_KEY=<...>
```

> ⚠ **NEXT_PUBLIC_API_URL** must NOT be set to a hardcoded HTTP IP in the web
> build. It caused the "dashboard shows zeros on the domain" bug (HTTP IP called
> from an HTTPS page = mixed-content blocked). The web app resolves the API URL
> at runtime from the hostname, so leave `NEXT_PUBLIC_API_URL` unset unless you
> deliberately want to pin it to `https://api.anandipark.in/api/v1`.

---

## 5. What to include / exclude in the zip

**EXCLUDE (do not zip — huge and/or secret):**
- `node_modules/` (every level) — reinstall with `npm install`
- `.env`, `apps/api/.env`, `apps/web/.env.local`, `scripts/.env` — secrets
- `.next/`, `dist/`, `.turbo/` — build output
- `anandi-park-promo/renders/`, `anandi-park-promo/snapshots/`,
  `anandi-park-promo/.media/`, `anandi-park-promo/node_modules/`
- `.git/` is optional — you can keep it (preserves history) or drop it and
  re-clone from GitHub instead.

**INCLUDE:** everything else — all `src/`, the Prisma schema, `scripts/`,
the promo video source + assets (`anandi-park-promo/assets/*.wav`, `*.jpg`,
`bgm.mp3`, `index.html`), `.kiro/steering/`, and this handoff.

**Simplest reliable path:** don't zip at all — the code is already on GitHub.
On the new laptop just:
```bash
git clone https://github.com/sjaiswal210-beep/anandi.git
cd anandi && npm install
# then recreate .env files
```
Zip only if you also want the uncommitted local `.env` values and the promo
render assets moved without re-downloading.

A PowerShell script `scripts/make-handoff-zip.ps1` is included that builds a
clean zip with the right exclusions.

---

## 6. Deployment workflow (unchanged, important)

Deployment is **laptop → GitHub → VPS pulls**. Never push files directly to the
VPS from a corporate laptop (this was an enforced rule; the
`.kiro/steering/corporate-infosec.md` file was deleted from the working tree but
the policy still stands — do all VPS work from a phone/home PC, not the work
laptop).

**Branch note:** local work is on `master`; the remote default branch is `main`.
Push with `git push origin master:main`. On Windows PowerShell, git prints its
normal progress to stderr which PowerShell shows in red as if it were an error —
the push still succeeds. Verify with
`git ls-remote origin refs/heads/main` (compare the SHA to your last commit).

```bash
# On the new laptop
git add <specific files> && git commit -m "..." && git push origin master:main

# On the VPS (from phone / home PC — NOT a corporate laptop)
cd /opt/anandi-park/anandi && bash deploy-latest.sh
```

`deploy-latest.sh` does the whole routine: git pull → npm install → puppeteer
chrome → prisma generate → build shared packages → build API (clears stale
tsconfig.tsbuildinfo first) → `next build` → `pm2 restart`. The web app MUST be
rebuilt after any frontend change — a `git pull` alone does not update the
served bundle (deploy-latest.sh handles this).

**⚠️ Schema changes need an extra step.** This project uses `prisma db push`,
NOT tracked migrations (there is no `prisma/migrations/` folder, and
`deploy-latest.sh` only runs `prisma generate`). After any `schema.prisma`
change — e.g. the document-upload `DocumentType` enum additions — run this on
the VPS before/with the deploy, or the new columns/enum values won't exist in
Neon and inserts will fail:
```bash
cd /opt/anandi-park/anandi
npx prisma db push --schema=packages/database/prisma/schema.prisma --accept-data-loss
```
(Adding enum values / nullable columns is additive and safe; `--accept-data-loss`
is just Prisma's confirmation flag.)

---

## 7. Known open items (hand these to the next agent)

1. **WhatsApp bot — LINKED to +91 8007107799 and replying.** The recurring
   "connected but no replies" outage was traced to the **VPS disk filling to ~99%**
   (mostly `/tmp` Chromium temp junk) starving Chromium so the bridge reaps the
   `anandi-park` session. ⚠️ **If the bot ever goes silent again, read
   `WHATSAPP_TROUBLESHOOTING.md`** — exact root cause, step-by-step fix (free disk
   → restart bridge → if needed reset+re-scan session), one-liner recovery, and
   prevention crons. Keep-alive cron + DB-fault-tolerance are in code; the VPS
   auto-cleanup crons (daily 3am + ≥90% safety valve) and docker log cap were
   applied this session.
2. **The WhatsApp bridge is `whatsapp-web.js`, NOT Baileys**, and it is a
   SEPARATE project living INSIDE a docker container on the VPS
   (`citymaps-wabot-wa-bot-1`, image code at `/app/server.js`, port 8300,
   multi-tenant: 8 sessions, ours = `anandi-park`). It is NOT in this repo. A
   two-line edit was made to `/app/server.js` this session so it resolves the
   real phone behind privacy-masked `@lid` senders via `msg.getContact()` and
   forwards it as `senderPn` to our `/whatsapp-bot/incoming`. ⚠️ **That edit lives
   inside the container and is lost if the image is rebuilt** — a backup is at
   `/app/server.js.bak` and `/root/server.js` on the VPS. If the bridge is ever
   rebuilt, re-apply it (see `WHATSAPP_TROUBLESHOOTING.md`). Our API side already
   reads `senderPn` and backfills the lead's phone.
3. **`@lid` WhatsApp leads.** WhatsApp hides some senders behind a privacy
   `@lid` id (no phone). We handle it 3 ways: (a) bridge `senderPn` resolution
   (above), (b) the bot asks for a callback number and we parse it from chat
   (`extractIndianPhone`), (c) leads with no number are stored with an empty
   `phone`, a `number-hidden` tag + `waLid` in customFields, and the dashboard
   shows "Number hidden (WhatsApp)". See `whatsapp-bot.service.ts`.
4. **⏳ `prisma db push` pending on the VPS.** The document-upload feature added
   enum values (`LAYOUT_PLAN, TITLE_DOCUMENT, NA_ORDER, PRICE_LIST, SITE_PHOTOS`)
   to `DocumentType`. Run the `db push` command in section 6 on the VPS, or
   uploading those categories will fail with a Postgres enum error. (I could not
   reach Neon from the dev laptop to push it.)
5. **Google AdSense pending approval.** Script + `google-adsense-account` meta
   tag (client `ca-pub-3038930416209198`) are in the root layout; `ads.txt`,
   privacy/terms/about/contact pages, footer links, and sitemap are added. ⚠️
   **Verify the `ads.txt` hash** (`apps/web/public/ads.txt` currently uses the
   standard `f08c47fec0942fa0`) against what the AdSense dashboard shows, then
   request review.
6. **Neon DB password** was published in the old `deploy.sh` in the public repo
   and has NOT been rotated. Rotate it in the Neon console and update
   `DATABASE_URL` on the VPS.
7. **Repo is public.** Consider making it private.
8. **Blog pages** (`apps/web/src/components/site/blog-content.ts`) were written
   but the `/blog/[slug]` pages are not wired up yet (SEO work in progress).
9. **Meta lead forms** show empty until a Lead Ad form is created in Ads Manager.
   (Meta IS connected — page token, publish, and diagnostics all verified working.)
10. **Google Ads** has no API integration (dev-token approval takes weeks) —
    spend is tracked manually in the Ads & Costs dashboard.
11. **`uploads/` is a plain VPS directory** (prod runs via PM2, not
    docker-compose), so uploaded documents persist on disk and are served at
    `/uploads/documents/...` by the API's static handler. Not a container volume.
12. **AI-calling pagination bug (unfixed):** `callRecord.findMany ... skip is
    missing` Prisma error on the ai-calling records page. Low priority.
13. **Exposed secrets in chat history.** The Meta system-user token, Gemini key,
    and Sarvam key were pasted in conversation. They work; rotate when convenient.

See `PROJECT_STATE.md` for the full per-feature status.

---

## 7a. What changed in the most recent sessions (newest work)

Short changelog so a new agent knows what's fresh (all pushed to `main`):

- **Business number unified to +91 8007107799** across site, dashboard, bot, AI,
  ads (env `WHATSAPP_BUSINESS_NUMBER`). Old 75584 44117 retired.
- **WhatsApp bot restored & hardened:** connected to 8007107799, keep-alive cron,
  DB-fault-tolerant `handleIncomingMessage`, VPS disk-cleanup crons + docker log
  cap. Full runbook in `WHATSAPP_TROUBLESHOOTING.md`.
- **`@lid` real-number capture:** bridge `server.js` edit (getContact → senderPn)
  + API `senderPn` ingestion + chat-number extraction + clean dashboard display.
- **Throttled bulk WhatsApp "drip" sender** for the ~3000 imported CSV leads
  (`apps/api/src/modules/customer-data/broadcast-drip.service.ts`): hourly cron,
  business-hours only, daily cap (default 60), randomized delays, auto-pause on
  bridge error, text + photo/PDF links (bridge has no media route). Dashboard UI
  is the **Bulk Sender** tab on the WhatsApp page
  (`apps/web/src/app/(dashboard)/whatsapp/BulkSenderPanel.tsx`). Ban-risk: start
  with a low cap.
- **Document upload now works** (`/documents`): real multipart upload via Multer
  (`documents.controller.ts`), writes to `uploads/documents/`, 25MB limit, mime
  allowlist; frontend file picker + category modal; axios FormData Content-Type
  fix in `lib/api.ts`. ⏳ needs the `prisma db push` (open item #4).
- **Homepage funnel:** `/` serves the full `/project` site by default (good for
  SEO + AdSense); only ad clicks go to `/offer`. `/offer` + popup set a
  `anandi_lead_captured` cookie via `markLeadCaptured()`.
- **Google AdSense scaffolding:** adsbygoogle script + `google-adsense-account`
  meta tag in root layout, `public/ads.txt`, and `/privacy /terms /about
  /contact` content pages (shared `legal-page.tsx`) linked from the footer +
  sitemap. ⏳ verify ads.txt hash & request review (open item #5).
- **Bot persona softened:** answers questions directly; does NOT push a site
  visit on every message; may state prices but deflects loan/EMI/process;
  Marathi-first.
- **`.kiro/steering/corporate-infosec.md` was deleted** from the working tree
  (shows as a pending `D` in `git status`). The policy still applies — don't SSH
  to the VPS from a work laptop.

---

## 8. Branding + Marketing assets (all in `brand/`)

**Brand:** Rich-Land Developers (partners Yuvraj Gade & Rajan Kute). Contact
**+91 80071 07799** (current). Colors: slate `#0F172A`, gold `#F59E0B`,
emerald `#059669`.

> ⚠️ Brand/flex assets below were generated with the OLD number
> `+91 75584 44117` (the flex WhatsApp QR points at `wa.me/917558444117`).
> If you reprint any collateral, update the number to `918007107799` and
> regenerate (the QR is rebuilt by `scripts/replace-flex-qr.js`).

- **Logo:** master `brand/richlandlogo-master.png` (also `apps/web/public/rich-land-*.svg`).
  Regenerate the full HD kit (favicons, social, transparent/white/print variants)
  with `node scripts/build-brand-kit.js` (or `brand/build-brand-kit.cmd`).
- **Brand guide:** `brand/BRAND_GUIDE.md`, `brand/PHOTOSHOP_AND_PRINT.md`.
- **Print collateral** (`brand/templates/*.html` → render via
  `node scripts/render-print-templates.js`): visiting card, brochure cover +
  inside, flex portrait, hoarding, carry bag, letterhead.
- **40x40 ft Marathi flex** (the ground hoarding): source artwork was supplied as
  a PDF; extracted + edited by `scripts/extract-pdf-a85.js` then
  `scripts/replace-flex-qr.js`, which swaps the decorative QR for a REAL scannable
  WhatsApp QR (`wa.me/917558444117?text=Hi- Send more information`), removes the
  "+91", and enlarges the QR. Final: `brand/dist/flex-final/anandi-park-flex-40x40-final.pdf`.
  To regenerate: `node scripts/replace-flex-qr.js` (needs `qrcode` + `jsqr`
  installed: `npm i qrcode@1.5.4 jsqr@1.4.0 --no-save`; Chrome + ffmpeg on PATH).
- **AI video ad packages** (`brand/ad-campaign/*.md`): hero "Land vs Flat"
  cinematic, UGC talking-head, family/couple, and multi-language VO scripts — all
  copy-paste prompts for Google Flow / Nano Banana Pro / Veo 3.1 / Omni Flash.
  Marathi VO audio generated at `brand/ad-campaign/audio/marathi/`
  (`node scripts/generate-ad-vo-marathi.js`).
- **Dashboard:** everything above is downloadable at `/marketing-kit` (sidebar →
  Marketing Kit), served from `apps/web/public/brand/`.

**What is NOT committed** (gitignored, rebuildable): `brand/dist/` (HD raster
derivatives + flex renders). The masters, SVGs, templates, scripts, web-servable
PDFs/previews, and the extracted flex source ARE committed. After unzip on the
new machine, run the regenerate commands above to recreate `brand/dist/`.

## 9. Moving to another laptop / a different agent (e.g. Antigravity)

- The whole project is on GitHub; a fresh `git clone` + `npm install` + recreating
  `.env` is the cleanest start (see Section 3).
- If zipping instead, use `scripts/make-handoff-zip.ps1` (excludes node_modules,
  build output, `brand/dist`, renders; keeps `.env.example`, all source, brand
  masters/templates, ad packages, and these docs).
- A different AI agent should read `HANDOFF.md` then `PROJECT_STATE.md` first.
  All the image/video/flex tooling is plain Node scripts driven by ffmpeg + headless
  Chrome (no Kiro-specific dependency), so they run anywhere with Node 22 + ffmpeg
  + Chrome installed.
