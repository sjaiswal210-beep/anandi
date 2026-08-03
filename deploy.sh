#!/bin/bash
# ================================================
# Anandi Park Dashboard - VPS Deployment Script
# Run this on: root@147.93.169.183
#
# SECRETS ARE NOT STORED IN THIS FILE.
# Create /opt/anandi-park/anandi/.env before running.
# See .env.example for the full list of keys.
# ================================================

set -e

echo "🚀 Deploying Anandi Park Dashboard..."

# 1. Install Node.js 20 (if not present)
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 20 ]]; then
  echo "📦 Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "Node: $(node -v)"
echo "NPM: $(npm -v)"

# 2. Install PM2 (process manager)
if ! command -v pm2 &> /dev/null; then
  echo "📦 Installing PM2..."
  npm install -g pm2
fi

APP_DIR="/opt/anandi-park/anandi"
cd "$APP_DIR"
echo "📂 App directory: $APP_DIR"

# 3. Require .env — never generate secrets into a tracked file
if [ ! -f .env ]; then
  echo ""
  echo "❌ No .env found at $APP_DIR/.env"
  echo ""
  echo "Create it first, then re-run. Required keys:"
  echo "  DATABASE_URL, JWT_SECRET, GEMINI_API_KEY, GEMINI_MODEL,"
  echo "  VPS_WHATSAPP_URL, VPS_WHATSAPP_SECRET, VPS_WHATSAPP_BIZ_ID,"
  echo "  DEPLOY_SECRET, APP_URL, API_URL"
  echo ""
  echo "See .env.example for the full list."
  exit 1
fi

# 4. Verify the keys the app cannot start without
MISSING=""
for key in DATABASE_URL JWT_SECRET GEMINI_API_KEY; do
  if ! grep -q "^${key}=." .env; then
    MISSING="$MISSING $key"
  fi
done

if [ -n "$MISSING" ]; then
  echo "❌ .env is missing values for:$MISSING"
  exit 1
fi

# 5. Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# 6. Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate --schema=packages/database/prisma/schema.prisma

# 7. Build API
echo "🔨 Building API..."
cd apps/api && npx nest build && cd ../..

# 8. Build Frontend
echo "🔨 Building Frontend..."
cd apps/web && npx next build && cd ../..

# 9. Start with PM2
echo "🚀 Starting services with PM2..."
pm2 delete anandi-api 2>/dev/null || true
pm2 delete anandi-web 2>/dev/null || true

pm2 start apps/api/dist/apps/api/src/main.js --name anandi-api --env production

# next must be started from apps/web so it resolves .next correctly
cd apps/web
pm2 start npx --name anandi-web -- next start -p 3000
cd ../..

pm2 save
pm2 startup

echo ""
echo "✅ Deployment complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Dashboard: http://147.93.169.183:3000"
echo "📡 API:       http://147.93.169.183:4000"
echo "📚 Docs:      http://147.93.169.183:4000/docs"
echo "💬 WhatsApp:  Connected via 127.0.0.1:8300"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
