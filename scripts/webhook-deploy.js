// Auto-deploy webhook server
// Listens for GitHub push events and auto-deploys
// Runs on port 9000 on VPS

const http = require('http');
const { exec } = require('child_process');
const crypto = require('crypto');

const fs = require('fs');
const path = require('path');

const APP_DIR = process.env.APP_DIR || '/opt/anandi-park/anandi';
const PORT = Number(process.env.DEPLOY_PORT || 9000);

// Load DEPLOY_SECRET from the environment, falling back to APP_DIR/.env
// (gitignored). Never hardcode it here — this file is committed.
function readSecret() {
  if (process.env.DEPLOY_SECRET) return process.env.DEPLOY_SECRET;

  try {
    const envFile = fs.readFileSync(path.join(APP_DIR, '.env'), 'utf8');
    const match = envFile.match(/^DEPLOY_SECRET=(.*)$/m);
    if (match) return match[1].trim().replace(/^["']|["']$/g, '');
  } catch {
    // .env unreadable — handled below
  }

  return null;
}

const SECRET = readSecret();

if (!SECRET) {
  console.error('DEPLOY_SECRET is not set.');
  console.error(`Add DEPLOY_SECRET=<value> to ${path.join(APP_DIR, '.env')}, then:`);
  console.error('  pm2 restart anandi-deploy');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', service: 'anandi-deploy-webhook' }));
    return;
  }

  if (req.method !== 'POST' || req.url !== '/deploy') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    // Verify GitHub signature
    const signature = req.headers['x-hub-signature-256'];
    if (signature) {
      const hmac = crypto.createHmac('sha256', SECRET).update(body).digest('hex');
      const expected = 'sha256=' + hmac;
      if (signature !== expected) {
        console.log('Invalid signature, rejecting');
        res.writeHead(401);
        res.end('Invalid signature');
        return;
      }
    }

    console.log(`[${new Date().toISOString()}] Deploy triggered!`);
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'deploying' }));

    // Run deploy commands
    const commands = [
      `cd ${APP_DIR}`,
      'git pull origin main',
      'npm install --legacy-peer-deps --silent',
      'npx prisma generate --schema=packages/database/prisma/schema.prisma',
      'cd apps/api && npx nest build && cd ../..',
      'cd apps/web && npx next build && cd ../..',
      'pm2 restart anandi-api',
      'pm2 restart anandi-web',
    ].join(' && ');

    exec(commands, { cwd: APP_DIR, timeout: 300000 }, (err, stdout, stderr) => {
      if (err) {
        console.error(`[${new Date().toISOString()}] Deploy FAILED:`, err.message);
        console.error(stderr);
      } else {
        console.log(`[${new Date().toISOString()}] Deploy SUCCESS!`);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Deploy webhook listening on port ${PORT}`);
  console.log(`   GitHub webhook URL: http://147.93.169.183:${PORT}/deploy`);
  console.log(`   Secret: ${SECRET}`);
});
