// Real Lead Scraper for Anandi Park
// Scrapes Google Maps for people searching real estate in Wagholi/Bakori/Pune
// Runs as cron on VPS: */6 * * * * (every 6 hours)
// Based on: github.com/michaelkitas/Google-Maps-Leads-Scraper-Puppeteer

const puppeteer = require('puppeteer');
const axios = require('axios');

const CONFIG = {
  // Search queries for finding potential plot buyers
  queries: [
    'real estate agents Wagholi Pune',
    'property dealers Bakori Pune',
    'plot dealers Wagholi',
    'land for sale near Wagholi Pune',
    'real estate Hadapsar Pune',
    'property consultants Kharadi Pune',
    'plots Wagholi Bakori road',
  ],
  // Where to send scraped leads
  webhookUrl: 'http://127.0.0.1:4000/api/v1/lead-scraper/webhook',
  workspaceId: '', // Will be fetched from API
  maxResultsPerQuery: 10,
  headless: true,
  chromePath: '/usr/bin/chromium',
};

async function getWorkspaceId() {
  try {
    // Login to get workspace ID
    const login = await axios.post('http://127.0.0.1:4000/api/v1/auth/login', {
      email: 'Kalpdev@outlook.com',
      password: 'Kalpdev@1234',
    });
    const token = login.data.data.accessToken;
    const ws = await axios.get('http://127.0.0.1:4000/api/v1/workspaces', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return ws.data.data[0].id;
  } catch (e) {
    console.error('Failed to get workspace:', e.message);
    return null;
  }
}

async function scrapeGoogleMaps(query, browser) {
  const leads = [];
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for results to load
    await page.waitForSelector('[role="feed"]', { timeout: 10000 }).catch(() => {});

    // Scroll to load more results
    const feed = await page.$('[role="feed"]');
    if (feed) {
      for (let i = 0; i < 3; i++) {
        await page.evaluate((el) => el.scrollBy(0, 1000), feed);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // Extract business data
    const results = await page.evaluate(() => {
      const items = document.querySelectorAll('[role="feed"] > div > div > a');
      const data = [];
      items.forEach((item) => {
        const nameEl = item.querySelector('[class*="fontHeadlineSmall"]') || item.querySelector('.fontHeadlineSmall');
        const name = nameEl ? nameEl.textContent.trim() : '';
        const href = item.getAttribute('href') || '';
        if (name && href.includes('/maps/place/')) {
          data.push({ name, url: href });
        }
      });
      return data.slice(0, 10);
    });

    // Visit each result to get phone/details
    for (const result of results.slice(0, CONFIG.maxResultsPerQuery)) {
      try {
        await page.goto(result.url, { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise((r) => setTimeout(r, 2000));

        const details = await page.evaluate(() => {
          const getTextByAriaLabel = (label) => {
            const el = document.querySelector(`[aria-label*="${label}"]`);
            return el ? el.textContent.trim() : '';
          };

          // Try to find phone number
          const phoneEl = document.querySelector('[data-tooltip="Copy phone number"]') ||
            document.querySelector('button[aria-label*="Phone"]') ||
            document.querySelector('[data-item-id*="phone"]');
          const phone = phoneEl ? phoneEl.textContent.replace(/[^0-9+]/g, '') : '';

          // Try to find website
          const websiteEl = document.querySelector('[data-tooltip="Open website"]') ||
            document.querySelector('a[aria-label*="Website"]');
          const website = websiteEl ? websiteEl.getAttribute('href') || websiteEl.textContent : '';

          // Rating and reviews
          const ratingEl = document.querySelector('[role="img"][aria-label*="stars"]');
          const rating = ratingEl ? ratingEl.getAttribute('aria-label') : '';

          return { phone, website, rating };
        });

        if (details.phone && details.phone.length >= 10) {
          leads.push({
            name: result.name,
            phone: details.phone.replace(/^\+91/, '').replace(/^91/, ''),
            platform: 'google_maps',
            location: query,
            intent: 'researching',
            source: 'OTHER',
          });
        }
      } catch (e) {
        // Skip this result
      }
    }
  } catch (e) {
    console.error(`Error scraping "${query}":`, e.message);
  } finally {
    await page.close();
  }

  return leads;
}

async function main() {
  console.log(`[${new Date().toISOString()}] Starting lead scraper...`);

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    console.error('Cannot proceed without workspace ID');
    return;
  }

  console.log(`Workspace: ${workspaceId}`);
  console.log(`Queries: ${CONFIG.queries.length}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      executablePath: CONFIG.chromePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
      ],
    });

    const allLeads = [];

    for (const query of CONFIG.queries) {
      console.log(`Scraping: "${query}"...`);
      const leads = await scrapeGoogleMaps(query, browser);
      console.log(`  Found ${leads.length} leads`);
      allLeads.push(...leads);

      // Rate limiting - wait between queries
      await new Promise((r) => setTimeout(r, 5000 + Math.random() * 5000));
    }

    console.log(`\nTotal leads scraped: ${allLeads.length}`);

    if (allLeads.length > 0) {
      // Send to our webhook
      try {
        const res = await axios.post(`${CONFIG.webhookUrl}/${workspaceId}`, {
          leads: allLeads,
        });
        console.log(`Webhook response:`, res.data);
      } catch (e) {
        console.error('Webhook failed:', e.message);
      }
    }
  } catch (e) {
    console.error('Browser launch failed:', e.message);
    console.error('Make sure chromium is installed: apt install chromium-browser');
  } finally {
    if (browser) await browser.close();
  }

  console.log(`[${new Date().toISOString()}] Scraper finished.`);
}

main();
