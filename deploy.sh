#!/bin/bash
# ================================================
# Anandi Park Dashboard - VPS Deployment Script
# Run this on: root@147.93.169.183
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

# 3. Create app directory
APP_DIR="/opt/anandi-park"
mkdir -p $APP_DIR
cd $APP_DIR

# 4. If repo exists, pull. Otherwise, copy files.
# For now we'll use the tarball approach
echo "📂 App directory: $APP_DIR"

# 5. Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --production

# 6. Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate --schema=packages/database/prisma/schema.prisma

# 7. Build API
echo "🔨 Building API..."
cd apps/api && npx nest build && cd ../..

# 8. Build Frontend
echo "🔨 Building Frontend..."
cd apps/web && npx next build && cd ../..

# 9. Create .env if not exists
if [ ! -f .env ]; then
  echo "⚙️  Creating .env..."
  cat > .env << 'EOF'
NODE_ENV=production
APP_NAME=Anandi Park
APP_URL=http://147.93.169.183:3000
API_URL=http://147.93.169.183:4000

DATABASE_URL=postgresql://neondb_owner:npg_ni3PFjTR2AJN@ep-winter-bar-axncjrf4.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require

REDIS_URL=redis://localhost:6379

JWT_SECRET=anandi-park-jwt-secret-change-this-in-production
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d

GEMINI_API_KEY=AIzaSyCqJLUhzTUzjwSXa6HXyBTdzJn_KJHOzIU
GEMINI_MODEL=gemini-2.5-flash
AI_PROVIDER=gemini

VPS_WHATSAPP_URL=http://127.0.0.1:8300
VPS_WHATSAPP_SECRET=454da352e67942e3b11a42edf2159f74
VPS_WHATSAPP_BIZ_ID=anandi-park

WHATSAPP_VERIFY_TOKEN=anandi-park-verify
EOF
fi

# 10. Start with PM2
echo "🚀 Starting services with PM2..."
pm2 delete anandi-api 2>/dev/null || true
pm2 delete anandi-web 2>/dev/null || true

pm2 start apps/api/dist/apps/api/src/main.js --name anandi-api --env production
pm2 start node_modules/.bin/next --name anandi-web -- start -p 3000 --dir apps/web

pm2 save
pm2 startup

echo ""
echo "✅ Deployment complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Dashboard: http://147.93.169.183:3000"
echo "📡 API:       http://147.93.169.183:4000"
echo "📚 Docs:      http://147.93.169.183:4000/docs"
echo "💬 WhatsApp:  Connected via localhost:8300"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
