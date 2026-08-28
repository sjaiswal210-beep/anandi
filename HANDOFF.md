# Anandi Park — Project Handoff

This is the single source of truth for picking the project up on a new machine
with a new agent. Read this file first, then `PROJECT_STATE.md` for the detailed
feature status.

---

## 1. What this project is

**Anandi Park** — a marketing + CRM system for selling **84 residential plots**
by **Rich-Land Developers** (partners **Yuvraj Gade & Rajan Kute**) at GAT No. 279,
Village Bakori, Wagholi-Bakori Road, Taluka Haveli, Dist Pune.
Contact: **+91 75584 44117**.

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
| Public site | https://anandipark.in → redirects to `/project` |
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
VPS from a corporate laptop (see `.kiro/steering/corporate-infosec.md`).

```bash
# On the new laptop
git add -A && git commit -m "..." && git push

# On the VPS (from phone/home PC — NOT a corporate laptop)
cd /opt/anandi-park/anandi && git pull
cd apps/api && npx nest build && pm2 restart anandi-api
cd ../web && npx next build && pm2 restart anandi-web
```

The web app MUST be rebuilt (`npx next build`) after any frontend change — a
`git pull` alone does not update the served bundle.

---

## 7. Known open items (hand these to the next agent)

1. **WhatsApp session not linked.** The bridge at `VPS_WHATSAPP_URL` is running
   but no WhatsApp number is scanned in. Until the QR is scanned, inbound-lead
   auto-replies and the website-popup WhatsApp greeting are composed and stored
   but NOT delivered. Start/scan via the bridge's `/session/anandi-park/start`.
2. **Neon DB password** was published in the old `deploy.sh` in the public repo
   and has NOT been rotated. Rotate it in the Neon console and update
   `DATABASE_URL` on the VPS.
3. **Repo is public.** Consider making it private.
4. **Blog pages** (`apps/web/src/components/site/blog-content.ts`) were written
   but the `/blog/[slug]` pages are not wired up yet (SEO work in progress).
5. **Meta lead forms** show empty until a Lead Ad form is created in Ads Manager.
   (Meta IS connected — page token, publish, and diagnostics all verified working.)
6. **Google Ads** has no API integration (dev-token approval takes weeks) —
   spend is tracked manually in the Ads & Costs dashboard.
7. **Exposed secrets in chat history.** The Meta system-user token and Sarvam key
   were pasted in conversation. They work; rotate them when convenient.

See `PROJECT_STATE.md` for the full per-feature status.

---

## 8. Branding + Marketing assets (all in `brand/`)

**Brand:** Rich-Land Developers (partners Yuvraj Gade & Rajan Kute). Contact
**+91 75584 44117**. Colors: slate `#0F172A`, gold `#F59E0B`, emerald `#059669`.

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
