#!/bin/bash
# Fix the Gemini API key on the VPS and restart the API with a clean environment.
#
# Run on the VPS:
#   cd /opt/anandi-park/anandi
#   bash scripts/fix-api-env.sh
#
# Prompts for the key so it never lands in shell history.

set -e

APP_DIR="/opt/anandi-park/anandi"
cd "$APP_DIR"

echo "=============================================="
echo " Anandi Park — API environment fix"
echo "=============================================="
echo ""

# 1. A stray .env.local silently wins over .env
if [ -f .env.local ]; then
  echo "[1/6] Found .env.local, which overrides .env. Moving it aside."
  mv .env.local ".env.local.disabled-$(date +%s)"
else
  echo "[1/6] No .env.local in the app root. Good."
fi

# 2. Ask for the key
echo ""
echo "[2/6] Paste your Gemini API key (starts with AQ.), then press Enter:"
read -r -s NEW_KEY
echo ""

NEW_KEY="$(echo -n "$NEW_KEY" | tr -d '[:space:]' | tr -d '"' | tr -d "'")"

if [ -z "$NEW_KEY" ]; then
  echo "  ERROR: nothing entered. Aborting."
  exit 1
fi

echo "  Received ${#NEW_KEY} characters, starting ${NEW_KEY:0:6}..."

if [ "${#NEW_KEY}" -lt 30 ]; then
  echo "  ERROR: that is too short to be a valid key. Aborting."
  exit 1
fi

# 3. Verify the key against Google before touching anything
echo ""
echo "[3/6] Checking the key with Google..."
HTTP_CODE=$(curl -s -o /tmp/gemini-check.json -w "%{http_code}" \
  "https://generativelanguage.googleapis.com/v1beta/models?key=${NEW_KEY}")

if [ "$HTTP_CODE" != "200" ]; then
  echo "  ERROR: Google rejected this key (HTTP $HTTP_CODE):"
  sed -n 's/.*"message": *"\([^"]*\)".*/    \1/p' /tmp/gemini-check.json | head -1
  rm -f /tmp/gemini-check.json
  echo ""
  echo "  Create a fresh key at https://aistudio.google.com/apikey and run this again."
  exit 1
fi

MODEL_COUNT=$(grep -o '"name": *"models/' /tmp/gemini-check.json | wc -l)
echo "  OK — key is valid, $MODEL_COUNT models available."
rm -f /tmp/gemini-check.json

# 4. Write it into .env
echo ""
echo "[4/6] Updating .env"
cp .env ".env.backup-$(date +%s)"

if grep -q '^GEMINI_API_KEY=' .env; then
  # Use a Perl one-liner so slashes and dots in the key are not treated as delimiters
  KEY="$NEW_KEY" perl -pi -e 's/^GEMINI_API_KEY=.*$/"GEMINI_API_KEY=$ENV{KEY}"/e' .env
else
  echo "GEMINI_API_KEY=$NEW_KEY" >> .env
fi

WROTE=$(grep '^GEMINI_API_KEY=' .env | cut -d= -f2-)
if [ "$WROTE" != "$NEW_KEY" ]; then
  echo "  ERROR: .env does not match what was entered. Restoring backup."
  cp "$(ls -t .env.backup-* | head -1)" .env
  exit 1
fi
echo "  .env now holds a ${#WROTE}-character key. Backup saved."

# 5. Restart clean. PM2 caches env, so delete rather than restart.
echo ""
echo "[5/6] Restarting the API with a clean environment"
pm2 delete anandi-api 2>/dev/null || true
pm2 start apps/api/dist/apps/api/src/main.js --name anandi-api
pm2 save
sleep 6

# 6. Confirm what the running process actually loaded
echo ""
echo "[6/6] Verifying via the API"
curl -s http://127.0.0.1:4000/api/v1/social-media/image-diagnostics \
  | sed -e 's/,"/,\n  "/g' -e 's/^{/{\n  /' || true

echo ""
echo ""
echo "=============================================="
echo " Done."
echo ""
echo " Look for \"ok\": true in the liveCheck above."
echo " Then open:"
echo "   http://147.93.169.183:3000/plotting/social"
echo " and generate a post with the image box checked."
echo "=============================================="
