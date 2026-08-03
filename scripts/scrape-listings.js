// Scrape property listing sites for leads (99acres, MagicBricks, Facebook Groups)
// Finds: agents listing plots in Wagholi/Bakori/Pune area
// These agents likely HAVE buyers looking for plots — call them as referral leads

const puppeteer = require('puppeteer');
const axios = require('axios');

const CONFIG = {
  webhookUrl: 'http://127.0.0.1:4000/api/v1/lead-scraper/webhook',
  chromePath: '/usr/bin/chromium',
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

    results.forEach((r) => {
      if (r.name) {
        leads.push({
          name: r.name,
          phone: '',
          platform: 'magicbricks',
          location: 'Wagholi Pune',
          intent: 'agent_with_buyers',
        });
      }
    });

    console.log(`  MagicBricks: Found ${leads.length} agents`);
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
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      executablePath: CONFIG.chromePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    console.log('Scraping 99acres...');
    const leads99 = await scrape99acres(browser);

    console.log('Scraping MagicBricks...');
    const leadsMB = await scrapeMagicBricks(browser);

    console.log('Scraping Facebook Groups...');
    const leadsFB = await scrapeFacebookGroups(browser);

    const allLeads = [...leads99, ...leadsMB, ...leadsFB].filter(l => l.phone && l.phone.length >= 10);
    console.log(`\nTotal leads with phone numbers: ${allLeads.length}`);

    if (allLeads.length > 0) {
      try {
        const res = await axios.post(`${CONFIG.webhookUrl}/${workspaceId}`, { leads: allLeads });
        console.log('Webhook result:', res.data);
      } catch (e) { console.error('Webhook failed:', e.message); }
    }
  } catch (e) {
    console.error('Browser failed:', e.message);
  } finally {
    if (browser) await browser.close();
  }

  console.log(`[${new Date().toISOString()}] Listing scraper finished.`);
}

main();
