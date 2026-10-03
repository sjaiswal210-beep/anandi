# WhatsApp Bot — Troubleshooting Runbook

> Quick-recovery guide for when the WhatsApp bot (Priya) stops replying.
> Written after a real incident (Sep–Oct 2026). Read §1 first — the root cause
> is almost always **the VPS disk filling up**, not the app code.

---

## 0. Architecture (how a reply actually happens)

```
Customer sends WhatsApp to 8007107799
   → WhatsApp bridge (Docker container `citymaps-wabot-wa-bot-1` on the VPS, port 8300)
   → bridge POSTs to  API  POST /api/v1/whatsapp-bot/incoming
   → API (anandi-api, PM2) builds a reply via Gemini + reads/writes Neon DB
   → API calls the bridge  POST /session/anandi-park/send
   → bridge delivers the reply on WhatsApp
```

Key facts:
- **Bridge** = a SHARED, multi-tenant Baileys/whatsapp-web.js container (`citymaps-wabot`).
  It runs ~8 WhatsApp sessions, each a headless **Chromium**. Session cap is 8 (`slots: max 8`).
  Our session id (`VPS_WHATSAPP_BIZ_ID`) is **`anandi-park`**. Session data lives in the Docker
  volume `citymaps-wabot_wabot_sessions` → `/var/lib/docker/volumes/citymaps-wabot_wabot_sessions/_data/session-anandi-park`.
- **Business number:** `+91 8007107799` (env `WHATSAPP_BUSINESS_NUMBER`, default `918007107799`).
- The bridge source is NOT in this repo (it's a separate `citymaps` project on the VPS).
- Public status/control endpoints (no auth, usable from a browser):
  - `GET  https://api.anandipark.in/api/v1/whatsapp-bot/vps/status`  → session status + qr
  - `GET/POST https://api.anandipark.in/api/v1/whatsapp-bot/vps/start`   → start/activate session
  - (bridge-direct, needs secret) `POST http://127.0.0.1:8300/session/anandi-park/send`

---

## 1. ROOT CAUSE (what actually breaks it): the VPS disk fills to ~99%

The box is a 73 GB Contabo VPS shared by many apps + the 8-session WhatsApp bridge.
When disk hits ~98–100%, **Chromium can't launch** → the bridge logs
`init Runtime.callFunctionOn timed out` and `reaping idle session anandi-park`
→ the session gets stuck at `authenticated` and NEVER reaches `connected`
→ **status may still SAY "connected", but sending fails** (HTTP 500 then 400).

> The #1 culprit was **`/tmp` growing to ~39 GB** of orphaned Chromium/snap temp files.
> Second culprit: `/root/.npm` cache (~4.7 GB) and unbounded Docker container logs.

### Symptom → meaning cheat-sheet
| What you see | What it means |
| --- | --- |
| Dashboard shows "Connected" but **no replies** | session reaped/dormant (disk starvation) |
| `/vps/send` returns `{"error":"...500"}` | bridge/Chromium crashed |
| `/vps/send` returns `{"error":"...400"}` | session stuck at `authenticated`, not `connected` |
| status stuck at `"authenticated"` across restarts | stale session auth → needs session reset + re-scan |
| `Sessions: 8/8` | bridge full, no slot for anandi-park |
| `/vps/send` returns `{"sent":true}` | **WORKING** ✅ |

---

## 2. THE FIX (step by step, run on the VPS via Contabo web console or SSH from a personal device)

> NOTE: do VPS ops from a personal device/Contabo console. (The dev's corporate
> laptop policy forbids connecting to this VPS from that machine.)

### Step 1 — Check & free the disk (this is usually the whole fix)
```bash
df -h /                              # if Use% is ~95%+, this is the problem
du -h -d2 / 2>/dev/null | sort -rh | head -20   # find the hog (usually /tmp)

# Safe cleanup (frees the space that was the root cause):
find /tmp -type f -atime +1 -delete 2>/dev/null
rm -rf /tmp/snap-private-tmp/* 2>/dev/null
npm cache clean --force 2>/dev/null
rm -rf /root/.npm/_cacache 2>/dev/null
journalctl --vacuum-size=200M 2>/dev/null
docker image prune -f 2>/dev/null
df -h /                              # want this WELL under 90% (we got it to 42%)
```

### Step 2 — Restart the bridge
```bash
docker restart citymaps-wabot-wa-bot-1
sleep 60
docker logs --tail 20 citymaps-wabot-wa-bot-1   # look for anandi-park connecting (not "reaping/timed out")
```

### Step 3 — If still stuck at `authenticated` → reset ONLY the anandi-park session + re-scan
```bash
docker stop citymaps-wabot-wa-bot-1
# IMPORTANT: delete ONLY session-anandi-park. NEVER delete the other sessions
# (admin, ecom-admin, admin-citymaps, the UUID ones) — they belong to other tenants.
rm -rf /var/lib/docker/volumes/citymaps-wabot_wabot_sessions/_data/session-anandi-park
docker start citymaps-wabot-wa-bot-1
sleep 50
curl -s http://127.0.0.1:8300/session/anandi-park/start -X POST \
  -H "X-Wa-Secret: $(grep -oP 'VPS_WHATSAPP_SECRET=\K.*' /opt/anandi-park/anandi/.env)"; echo
```
Then get the QR and scan it with **8007107799** (WhatsApp → Linked Devices → Link a device):
- open `https://api.anandipark.in/api/v1/whatsapp-bot/vps/status` → the `qr` field has the code,
  OR the bridge may print it in `docker logs`.

### Step 4 — Verify it actually SENDS (status alone lies)
```bash
# From anywhere:
curl -s https://api.anandipark.in/api/v1/whatsapp-bot/vps/status
# Should be {"status":"connected"}. Then send a real test:
curl -s https://api.anandipark.in/api/v1/whatsapp-bot/vps/send -X POST \
  -H "Content-Type: application/json" \
  -d '{"to":"91XXXXXXXXXX","message":"test - please ignore"}'
# {"sent":true}  = FIXED.  {"error":...} = still broken, go back to Step 1/3.
```

---

## 3. PERMANENT PREVENTION (so it doesn't recur)

1. **Auto-cleanup cron** (daily + a 30-min safety valve that triggers at ≥90% disk):
   ```bash
   (crontab -l 2>/dev/null | grep -v 'anandi-autoclean'; \
    echo "0 3 * * * find /tmp -type f -atime +2 -delete 2>/dev/null; rm -rf /tmp/snap-private-tmp/* 2>/dev/null; npm cache clean --force 2>/dev/null; journalctl --vacuum-size=200M 2>/dev/null; docker image prune -f 2>/dev/null # anandi-autoclean"; \
    echo "*/30 * * * * [ \$(df / | awk 'NR==2{print \$5+0}') -ge 90 ] && (find /tmp -type f -atime +1 -delete; rm -rf /tmp/snap-private-tmp/*; journalctl --vacuum-size=100M) 2>/dev/null # anandi-autoclean") | crontab -
   ```
2. **Cap Docker container logs** (prevents unbounded log growth filling disk):
   ```bash
   echo '{"log-driver":"json-file","log-opts":{"max-size":"50m","max-file":"3"}}' > /etc/docker/daemon.json
   # applies to containers on next (re)create
   ```
3. **In-app safeguards already deployed (code):**
   - `whatsapp-keepalive.service.ts` — pings the session every 5 min so the bridge
     doesn't reap it as idle; restarts it if not connected.
   - `handleIncomingMessage` is now **DB-fault-tolerant** — a Neon auto-suspend
     (`57P01` "terminating connection") can no longer stop Priya's reply; every DB
     call is wrapped and falls back to the hardcoded workspace id.
4. **Best long-term fix:** the 73 GB disk is small for 8 Chromium sessions + 6 apps.
   Upgrading the Contabo disk removes the pressure entirely.

---

## 4. Secondary issues seen in the same logs (not the bot outage, but worth noting)
- **Neon DB drops connections** (`Can't reach database server ... 57P01`): Neon auto-suspends
  on idle. Handled in code now (see §3.3), but a paid/always-on Neon tier would remove the blips.
- **`callRecord.findMany ... skip is missing`**: a Prisma pagination bug on the AI-calling
  records page. Unrelated to the bot; fix separately when touching ai-calling.

---

## 5. One-liner recovery (disk + restart) — paste on the VPS
```bash
find /tmp -type f -atime +1 -delete 2>/dev/null; rm -rf /tmp/snap-private-tmp/* 2>/dev/null; npm cache clean --force 2>/dev/null; journalctl --vacuum-size=200M 2>/dev/null; docker image prune -f 2>/dev/null; df -h /; docker restart citymaps-wabot-wa-bot-1; sleep 60; curl -s https://api.anandipark.in/api/v1/whatsapp-bot/vps/start; echo
```
If after this the status is `connected` and a test `/vps/send` returns `{"sent":true}`, you're done.
If it stays `authenticated`, do §2 Step 3 (reset session + re-scan QR with 8007107799).
