#!/bin/bash
# ================================================
# Anandi Park — routine "pull latest & redeploy" script
# Run this ON the VPS (from your phone/home PC SSH), NOT from a laptop:
#     ssh root@147.93.169.183
#     cd /opt/anandi-park/anandi && bash deploy-latest.sh
#
# Assumes first-time setup (Node, PM2, .env) is already done. If not, use
# deploy.sh instead. Secrets stay in /opt/anandi-park/anandi/.env (untracked).
# ================================================

set -e

APP_DIR="/opt/anandi-park/anandi"
cd "$APP_DIR"
echo "📂 $APP_DIR"

# 1. Pull the latest code from GitHub main.
echo "⬇️  git pull..."
git pull origin main

# 2. Ensure .env still present (never overwritten by git).
if [ ! -f .env ]; then
  echo "❌ No .env at $APP_DIR/.env — create it before deploying (see .env.example)."
  exit 1
fi

# 3. Install deps (package.json changed: added puppeteer, sharp is used, etc.)
echo "📦 npm install..."
npm install --legacy-peer-deps

# 4. Puppeteer needs a browser for the attendance QR / payslip PDF features.
#    Harmless if already installed.
echo "🌐 Ensuring Chromium for puppeteer (attendance QR/PDF)..."
npx puppeteer browsers install chrome || echo "  (puppeteer chrome install skipped/failed — QR/PDF may need it)"

# 5. Regenerate Prisma client (HR models etc.).
echo "🗄️  prisma generate..."
npx prisma generate --schema=packages/database/prisma/schema.prisma

# 6. Build shared packages first (api imports @realtyos/database + shared).
echo "🔨 Building shared packages..."
npx turbo run build --filter=@realtyos/database --filter=@realtyos/shared || {
  echo "  turbo package build failed — continuing; nest build may still work"; }

# 7. Build API. Clear any stale incremental build info first (this has caused
#    empty compiles that produce a missing dist/main).
echo "🔨 Building API..."
cd apps/api
rm -f tsconfig.tsbuildinfo
rm -rf dist
npx nest build
cd ../..

# 8. Build the web frontend (REQUIRED after any frontend change — a git pull
#    alone does NOT update the served bundle).
echo "🔨 Building web..."
cd apps/web
npx next build
cd ../..

# 9. Restart the running services (do not recreate — keeps existing env).
echo "🔁 Restarting PM2 services..."
pm2 restart anandi-api --update-env
pm2 restart anandi-web --update-env
pm2 save

echo ""
echo "✅ Redeploy complete."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Verify:"
echo "  https://api.anandipark.in/api/v1/ads/meta/capabilities   (can the token create ads?)"
echo "  https://api.anandipark.in/api/v1/social-media/publish-diagnostics"
echo "  https://anandipark.in/dashboard  →  Ads & Costs → Create Meta Ad"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
