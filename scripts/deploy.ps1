# Automated deployment script for Anandi Park VPS
# Usage: powershell scripts/deploy.ps1

$vpsHost = "147.93.169.183"
$vpsUser = "root"
$sshKey = "C:\Users\ADMIN\.ssh\id_ed25519"

Write-Host "🚀 Starting Deployment on Anandi Park VPS..." -ForegroundColor Green

Write-Host "1. Connecting to VPS, fetching latest code from GitHub and building..." -ForegroundColor Cyan

# SSH command to execute the full deployment pipeline on the server
ssh -i $sshKey -o StrictHostKeyChecking=accept-new "${vpsUser}@${vpsHost}" @"
  echo '--- VPS deployment started ---'
  cd /opt/anandi-park/anandi
  
  echo '[1/5] Pulling latest code...'
  git pull origin main
  
  echo '[2/5] Installing dependencies...'
  npm install --legacy-peer-deps --silent
  
  echo '[3/5] Generating Prisma client...'
  npx prisma generate --schema=packages/database/prisma/schema.prisma
  
  echo '[4/5] Building NestJS API...'
  cd apps/api && npx nest build && cd ../..
  
  echo '[5/5] Building Next.js Web App...'
  cd apps/web && npx next build && cd ../..
  
  echo '[Success] Restarting processes in PM2...'
  pm2 restart anandi-api
  pm2 restart anandi-web
  
  echo '--- VPS deployment completed successfully! ---'
"@

Write-Host "🎉 Live site at https://anandipark.in is now updated!" -ForegroundColor Green
