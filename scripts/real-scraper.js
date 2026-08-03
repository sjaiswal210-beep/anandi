// Real Lead Scraper for Anandi Park
// Scrapes Google Maps for people searching real estate in Wagholi/Bakori/Pune
// Runs as cron on VPS: */6 * * * * (every 6 hours)
// Based on: github.com/michaelkitas/Google-Maps-Leads-Scraper-Puppeteer

const puppeteer = require('puppeteer');
const axios = require('axios');
const { launchBrowser } = require('./lib/browser');

const CONFIG = {
  // Search queries for finding potential plot buyers
  queries: [
    // Google Maps - real estate businesses
    'real estate agents Wagholi Pune',
    'property dealers Bakori Pune',
    'plot dealers Wagholi',
    'land for sale near Wagholi Pune',
    'real estate Hadapsar Pune',
    'property consultants Kharadi Pune',
    'plots Wagholi Bakori road',
    'NA plot dealers Pune',
    'land brokers Haveli taluka',
    'real estate investment Pune',
  ],
  // Where to send scraped leads
  webhookUrl: 'http://127.0.0.1:4000/api/v1/lead-scraper/webhook',
  workspaceId: '', // Will be fetched from API
  maxResultsPerQuery: 10,
  headless: true,
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

// When a query returns nothing, capture the page so the cause is diagnosable
// instead of the run just reporting zero.
async function dumpDebug(page, query) {
  try {
    const fs = require('fs');
    const pathMod = require('path');
    const dir = pathMod.join(__dirname, '..', 'logs', 'scraper-debug');
    fs.mkdirSync(dir, { recursive: true });

    const slug = query.replace(/[^a-z0-9]+/gi, '-').slice(0, 40);
    const stamp = Date.now().toString(36);

    await page.screenshot({ path: pathMod.join(dir, `${slug}-${stamp}.png`), fullPage: false });
    const html = await page.content();
    fs.writeFileSync(pathMod.join(dir, `${slug}-${stamp}.html`), html);

    const title = await page.title();
    console.warn(`    debug saved to logs/scraper-debug/${slug}-${stamp}.*  (page title: "${title}")`);

    // A consent wall or bot check is the usual reason for an empty feed.
    if (/consent|before you continue|sorry/i.test(html.slice(0, 5000))) {
      console.warn('    page looks like a consent or bot-check wall, not results');
    }
  } catch (e) {
    console.warn(`    could not save debug output: ${e.message}`);
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

    // Extract business data. Anchored on href and aria-label rather than
    // Google's generated class names, which change without notice.
    const results = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
      const seen = new Set();
      const data = [];

      for (const a of anchors) {
        const href = a.getAttribute('href') || '';
        // aria-label carries the business name; fall back to inner text.
        let name = (a.getAttribute('aria-label') || '').trim();
        if (!name) {
          const headline = a.querySelector('[class*="fontHeadline"]');
          name = headline ? headline.textContent.trim() : '';
        }
        if (!name || seen.has(href)) continue;
        seen.add(href);
        data.push({ name, url: href.startsWith('http') ? href : `https://www.google.com${href}` });
      }

      return data.slice(0, 20);
    });

    if (results.length === 0) {
      console.warn(`  no result cards matched for "${query}"`);
      await dumpDebug(page, query);
    }

    // Visit each result to get phone/details
    for (const result of results.slice(0, CONFIG.maxResultsPerQuery)) {
      try {
        await page.goto(result.url, { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise((r) => setTimeout(r, 2000));

        const details = await page.evaluate(() => {
          // Most reliable source: the phone is embedded in the attribute
          // itself, e.g. data-item-id="phone:tel:+912012345678"
          let phone = '';
          const phoneAttrEl = document.querySelector('[data-item-id^="phone:tel:"]');
          if (phoneAttrEl) {
            phone = (phoneAttrEl.getAttribute('data-item-id') || '').replace('phone:tel:', '');
          }

          // Fallbacks for layout variants.
          if (!phone) {
            const alt =
              document.querySelector('[data-tooltip="Copy phone number"]') ||
              document.querySelector('button[aria-label*="Phone"]');
            if (alt) {
              phone = (alt.getAttribute('aria-label') || alt.textContent || '');
            }
          }
          phone = phone.replace(/[^0-9+]/g, '');

          const websiteEl =
            document.querySelector('a[data-item-id="authority"]') ||
            document.querySelector('[data-tooltip="Open website"]') ||
            document.querySelector('a[aria-label*="Website"]');
          const website = websiteEl
            ? websiteEl.getAttribute('href') || websiteEl.textContent.trim()
            : '';

          const ratingEl = document.querySelector('[role="img"][aria-label*="star"]');
          const rating = ratingEl ? ratingEl.getAttribute('aria-label') : '';

          const addressEl = document.querySelector('[data-item-id="address"]');
          const address = addressEl
            ? (addressEl.getAttribute('aria-label') || addressEl.textContent).replace(/^Address:\s*/, '').trim()
            : '';

          return { phone, website, rating, address };
        });

        const normalised = details.phone.replace(/^\+91/, '').replace(/^91/, '');

        // Indian mobile/landline sanity check — rejects truncated garbage.
        if (normalised.length >= 10) {
          leads.push({
            name: result.name,
            phone: normalised,
            platform: 'google_maps',
            location: details.address || query,
            intent: 'researching',
            source: 'OTHER',
            rawData: {
              query,
              website: details.website || undefined,
              rating: details.rating || undefined,
              mapsUrl: result.url,
              scrapedAt: new Date().toISOString(),
            },
          });
        } else {
          console.log(`    ${result.name}: no phone listed, skipped`);
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
    browser = await launchBrowser(puppeteer, { headless: CONFIG.headless });

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
    console.error('Scrape run failed:', e.message);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }

  console.log(`[${new Date().toISOString()}] Scraper finished.`);
}

main();
