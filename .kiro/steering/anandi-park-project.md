# Anandi Park — Project Memory (always-on steering)

This file is loaded into every session. It is the durable memory of the critical,
easy-to-get-wrong facts for this project. For the full picture read `HANDOFF.md`
then `PROJECT_STATE.md` (and `WHATSAPP_TROUBLESHOOTING.md` for the bot).

## What this is
Single-project marketing + CRM for **Anandi Park** — 84 **residential plots** by
**Rich-Land Developers** (Yuvraj Gade & Rajan Kute), Bakori, Wagholi, Pune East.
Turborepo: `apps/api` (NestJS+Prisma, :4000), `apps/web` (Next.js 15, :3000),
`apps/worker`, `packages/database` (Prisma), `packages/shared`.

## Non-negotiable facts (do not get these wrong)
- Business number: **+91 8007107799** (WhatsApp `918007107799`). Env
  `WHATSAPP_BUSINESS_NUMBER`. Old 75584 44117 is RETIRED.
- Product = **"residential plots"**, NEVER "NA plots".
- **NO RERA** — never claim it anywhere.
- Price **₹18 Lakh+**; NOT shown on site/ads (capture lead first). The bot MAY
  state prices but must NOT explain loan/EMI/process (just "details bhej deti hoon").
- Offer hook: **Free TVS Jupiter with every plot booking** (limited period).
- Workspace id (hardcoded, single-tenant): `cmsai8kh50001rapl8ioxehxe`.
- Dashboard password gate: `Kalpdev@1994`. Admin login:
  `Kalpdev@outlook.com` / `Kalpdev@1234`.
- Bot persona **Priya**: Marathi-first, polite, no greeting every message,
  answers directly, does NOT push a site visit every message.

## Live environment
- Site https://anandipark.in · API https://api.anandipark.in · Dashboard /dashboard
- GitHub https://github.com/sjaiswal210-beep/anandi (⚠ PUBLIC). Local branch
  `master`, remote default `main` → push `git push origin master:main`.
- VPS 147.93.169.183 (Contabo, Ubuntu), app at `/opt/anandi-park/anandi`, PM2
  (`anandi-api`, `anandi-web`, `anandi-deploy`), nginx + certbot. DB = Neon cloud.

## Hard rules learned
- **Deploy = laptop → GitHub → VPS `bash deploy-latest.sh`.** Never SSH to the
  VPS from the work/corporate laptop (do VPS ops from a phone / home PC / Contabo
  console). Local dev + localhost is fine.
- `git pull` does NOT update the web frontend — it must be rebuilt (`next build`;
  deploy-latest.sh does this). `next build` can OOM on a laptop — use
  `npx tsc --noEmit` to typecheck instead when iterating.
- **No tracked Prisma migrations** — uses `prisma db push`. After any
  `schema.prisma` change run on the VPS:
  `npx prisma db push --schema=packages/database/prisma/schema.prisma --accept-data-loss`.
- API build output is NESTED at `apps/api/dist/apps/api/src/main.js` (intended);
  clear `tsconfig.tsbuildinfo` before `nest build`.
- Windows PowerShell: use `;` not `&&`; quote paths with `(site)`/`(dashboard)`;
  git push prints stderr in red but SUCCEEDS — verify with
  `git ls-remote origin refs/heads/main`.
- Only commit specific files (not `git add -A`) — build artifacts under
  `packages/shared/src/*.js|.d.ts` and a pending `D .kiro/steering/corporate-infosec.md`
  tend to show up in `git status`; leave them out of feature commits.

## WhatsApp bridge (critical, separate from this repo)
- It's **whatsapp-web.js** (NOT Baileys), a separate project INSIDE docker
  container `citymaps-wabot-wa-bot-1` on the VPS (`/app/server.js`, port 8300,
  multi-tenant 8 sessions, ours = `anandi-park`). Edits to its server.js are lost
  on image rebuild (backups: `/app/server.js.bak`, `/root/server.js`). It has a
  `@lid`→real-number `getContact()/senderPn` edit applied — re-apply if rebuilt
  (see `WHATSAPP_TROUBLESHOOTING.md` §6).
- Bot "connected but silent" root cause = **VPS disk full** starving Chromium.
  Runbook: `WHATSAPP_TROUBLESHOOTING.md`.
- Never delete other tenants' sessions when resetting — only `session-anandi-park`.

## Pending / watch-outs
- ⏳ Run `prisma db push` on the VPS for the document-upload `DocumentType` enum
  additions (LAYOUT_PLAN, TITLE_DOCUMENT, NA_ORDER, PRICE_LIST, SITE_PHOTOS).
- ⏳ Google AdSense: verify `apps/web/public/ads.txt` hash vs the AdSense
  dashboard, then request review (script + meta tag + pages already in place).
- Rotate the Neon DB password (was in the public repo's old deploy.sh) and the
  Meta/Gemini/Sarvam keys (pasted in chat history). Consider making the repo private.
