// Shared Puppeteer launcher.
//
// The Chromium path used to be hardcoded to /usr/bin/chromium, which silently
// broke scraping whenever that binary was absent. This resolves a browser from
// whatever is actually installed, and falls back to Puppeteer's own bundled
// download when nothing system-wide is found.

const fs = require('fs');

const CANDIDATE_PATHS = [
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/snap/bin/chromium',
  // Windows, for local testing
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

function resolveExecutablePath(puppeteer) {
  // Explicit override always wins.
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  for (const p of CANDIDATE_PATHS) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      // unreadable path, keep looking
    }
  }

  // Puppeteer's bundled browser, if the postinstall download ran.
  try {
    const bundled = puppeteer.executablePath();
    if (bundled && fs.existsSync(bundled)) return bundled;
  } catch {
    // older/newer API shape, ignore
  }

  return null;
}

async function launchBrowser(puppeteer, overrides = {}) {
  const executablePath = resolveExecutablePath(puppeteer);

  if (executablePath) {
    console.log(`Browser: ${executablePath}`);
  } else {
    console.log('Browser: none found on disk, letting Puppeteer choose its default');
  }

  const options = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
    ...overrides,
  };

  // Only set the key when a path was found; passing undefined makes
  // Puppeteer complain rather than use its default.
  if (executablePath) options.executablePath = executablePath;

  try {
    return await puppeteer.launch(options);
  } catch (e) {
    console.error(`\nBrowser launch failed: ${e.message}`);
    console.error('\nInstall a browser on this host with one of:');
    console.error('  npx puppeteer browsers install chrome     (recommended, no root needed)');
    console.error('  apt-get install -y chromium               (Debian)');
    console.error('  snap install chromium                     (Ubuntu)');
    console.error('\nOr point PUPPETEER_EXECUTABLE_PATH at an existing binary.');
    throw e;
  }
}

module.exports = { launchBrowser, resolveExecutablePath };
