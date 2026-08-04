// Scrape property listing sites for leads (99acres, MagicBricks, Facebook Groups)
// Finds: agents listing plots in Wagholi/Bakori/Pune area
// These agents likely HAVE buyers looking for plots — call them as referral leads

const puppeteer = require('puppeteer');
const axios = require('axios');
const { launchBrowser } = require('./lib/browser');

const CONFIG = {
  webhookUrl: 'http://127.0.0.1:4000/api/v1/lead-scraper/webhook',
  headless: true,
};

async function getWorkspaceId() {
  try {
    const login = await axios.post('http://127.0.0.1:4000/api/v1/auth/login', {
      email: 'Kalpdev@outlook.com', password: 'Kalpdev@1234',
    });
    const token = login.data.data.accessToken;
    const ws = await axios.get('http://127.0.0.1:4000/api/v1/workspaces', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return ws.data.data[0].id;
  } catch (e) { console.error('Auth failed:', e.message); return null; }
}

// Scrape 99acres for plot listings in Pune
async function scrape99acres(browser) {
  const leads = [];
  const page = await browser.newPage();
  try {
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36');
    await page.goto('https://www.99acres.com/search/property/buy/residential-land-plot-in-wagholi-pune?city=19&preference=S&area_unit=1&res_com=R', {
      waitUntil: 'networkidle2', timeout: 30000,
    });
    await new Promise(r => setTimeout(r, 3000));

    const results = await page.evaluate(() => {
      const listings = [];
      // Try to get agent/owner names and numbers from listing cards
      document.querySelectorAll('[class*="projectTuple"], [class*="srpTuple"], .srpWrap').forEach((card) => {
        const nameEl = card.querySelector('[class*="agentName"], [class*="ownerName"], .ownName');
        const phoneEl = card.querySelector('[class*="phone"], a[href^="tel:"]');
        const name = nameEl ? nameEl.textContent.trim() : '';
        const phone = phoneEl ? (phoneEl.getAttribute('href') || phoneEl.textContent).replace(/[^0-9]/g, '') : '';
        if (name || phone) {
          listings.push({ name: name || 'Property Agent', phone });
        }
      });
      return listings;
    });

    results.forEach((r) => {
      if (r.phone && r.phone.length >= 10) {
        leads.push({
          name: r.name,
          phone: r.phone.slice(-10),
          platform: '99acres',
          location: 'Wagholi Pune',
          intent: 'agent_with_buyers',
        });
      }
    });

    console.log(`  99acres: Found ${leads.length} agents with listings`);
  } catch (e) {
    console.error('  99acres scrape failed:', e.message);
  } finally {
    await page.close();
  }
  return leads;
}

// Scrape MagicBricks for plot listings
async function scrapeMagicBricks(browser) {
  const leads = [];
  const page = await browser.newPage();
  try {
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36');
    await page.goto('https://www.magicbricks.com/property-for-sale/residential-land+plot-in-Wagholi-Pune-pppfs', {
      waitUntil: 'networkidle2', timeout: 30000,
    });
    await new Promise(r => setTimeout(r, 3000));

    const results = await page.evaluate(() => {
      const listings = [];
      document.querySelectorAll('.mb-srp__card, [class*="srpCard"]').forEach((card) => {
        const nameEl = card.querySelector('[class*="seller"], [class*="agent"], .mb-srp__card__seller');
        const name = nameEl ? nameEl.textContent.trim() : '';
        if (name) listings.push({ name });
      });
      return listings;
    });

    // MagicBricks does not expose seller phone numbers without a logged-in
    // session and a click-to-reveal, so these can never pass the phone filter
    // in main(). Names are reported for visibility only.
    console.log(`  MagicBricks: ${results.length} seller names visible, 0 with phone numbers`);
    if (results.length > 0) {
      console.log('    (MagicBricks hides numbers behind login + click-to-reveal, so none are usable)');
    }
  } catch (e) {
    console.error('  MagicBricks scrape failed:', e.message);
  } finally {
    await page.close();
  }
  return leads;
}

// Scrape Facebook public groups for plot seekers
async function scrapeFacebookGroups(browser) {
  const leads = [];
  const page = await browser.newPage();
  const groups = [
    'https://www.facebook.com/groups/search/posts/?q=plot%20wagholi%20pune',
    'https://www.facebook.com/groups/search/posts/?q=land%20for%20sale%20pune',
  ];

  for (const groupUrl of groups) {
    try {
      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36');
      await page.goto(groupUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 3000));

      // Facebook requires login for most content, so this will have limited results
      const results = await page.evaluate(() => {
        const posts = [];
        document.querySelectorAll('[data-ad-preview="message"], [dir="auto"]').forEach((el) => {
          const text = el.textContent.trim();
          if (text.length > 20 && text.length < 500) {
            // Look for phone numbers in posts
            const phoneMatch = text.match(/\b[6-9]\d{9}\b/g);
            if (phoneMatch) {
              posts.push({ text: text.slice(0, 100), phone: phoneMatch[0] });
            }
          }
        });
        return posts;
      });

      results.forEach((r) => {
        leads.push({
          name: 'FB Group Lead',
          phone: r.phone,
          platform: 'facebook_groups',
          location: 'Pune',
          intent: 'looking_to_buy',
        });
      });
    } catch (e) {
      // Facebook often blocks, expected
    }
  }

  console.log(`  Facebook Groups: Found ${leads.length} potential buyers`);
  await page.close();
  return leads;
}

async function main() {
  console.log(`[${new Date().toISOString()}] Starting listing scraper...`);

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) return;

  let browser;
  try {
    browser = await launchBrowser(puppeteer, { headless: CONFIG.headless });

    console.log('Scraping 99acres...');
    const leads99 = await scrape99acres(browser);

    console.log('Scraping MagicBricks...');
    const leadsMB = await scrapeMagicBricks(browser);

    console.log('Scraping Facebook Groups...');
    const leadsFB = await scrapeFacebookGroups(browser);

    const candidates = [...leads99, ...leadsMB, ...leadsFB];
    const allLeads = candidates.filter((l) => l.phone && l.phone.length >= 10);
    const dropped = candidates.length - allLeads.length;

    console.log(`\nCandidates found: ${candidates.length}`);
    console.log(`Dropped for no usable phone: ${dropped}`);
    console.log(`Total leads with phone numbers: ${allLeads.length}`);

    if (allLeads.length === 0) {
      console.warn('\nNothing to send. These sources gate phone numbers behind a login:');
      console.warn('  99acres    — number revealed only after sign-in / OTP');
      console.warn('  MagicBricks— click-to-reveal behind login');
      console.warn('  Facebook   — group post search requires an authenticated session');
      console.warn('Google Maps (scripts/real-scraper.js) is the only source that publishes numbers openly.');
      return;
    }

    try {
      const res = await axios.post(
        `${CONFIG.webhookUrl}/${workspaceId}`,
        { leads: allLeads },
        { timeout: 60000 },
      );
      const d = res.data?.data || res.data;
      console.log(`Ingest result: ${d.ingested ?? '?'} new, ${d.duplicates ?? '?'} duplicates, ${d.errors ?? '?'} errors`);
    } catch (e) {
      console.error(`Webhook POST failed: ${e.response?.status || ''} ${e.message}`);
    }
  } catch (e) {
    console.error('Browser failed:', e.message);
  } finally {
    if (browser) await browser.close();
  }

  console.log(`[${new Date().toISOString()}] Listing scraper finished.`);
}

main();
