// Pulls new Meta Lead Ads submissions and post commenters into the CRM.
// Run from cron on the VPS, e.g. every 15 minutes:
//   */15 * * * * cd /opt/anandi-park/anandi && node scripts/poll-meta-leads.js >> /var/log/anandi-meta.log 2>&1

const axios = require('axios');

const API = 'http://127.0.0.1:4000/api/v1';
const EMAIL = process.env.ADMIN_EMAIL || 'Kalpdev@outlook.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'Kalpdev@1234';

async function main() {
  const stamp = new Date().toISOString();

  let token;
  let workspaceId;
  try {
    const login = await axios.post(`${API}/auth/login`, { email: EMAIL, password: PASSWORD });
    token = login.data.data.accessToken;
    const ws = await axios.get(`${API}/workspaces`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    workspaceId = ws.data.data[0].id;
  } catch (e) {
    console.error(`[${stamp}] Login failed: ${e.response?.status || ''} ${e.message}`);
    process.exit(1);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'X-Workspace-Id': workspaceId,
  };

  // Lead Ads submissions
  try {
    const res = await axios.post(`${API}/meta/poll-leads`, { sinceHours: 48 }, { headers });
    const d = res.data?.data || res.data;
    console.log(
      `[${stamp}] Lead Ads: ${d.fetched} fetched, ${d.ingested} new, ${d.skipped} known` +
        (d.message ? ` — ${d.message}` : ''),
    );
    (d.errors || []).forEach((e) => console.error(`  ${e}`));
  } catch (e) {
    const msg = e.response?.data?.message || e.message;
    console.error(`[${stamp}] Lead Ads poll failed: ${msg}`);
  }

  // Post commenters
  try {
    const res = await axios.post(`${API}/meta/sync-comments`, { limit: 25 }, { headers });
    const d = res.data?.data || res.data;
    console.log(
      `[${stamp}] Comments: ${d.commentsSeen} seen, ${d.leadsCreated} new leads, ${d.alreadyKnown} known`,
    );
    (d.errors || []).forEach((e) => console.error(`  ${e}`));
  } catch (e) {
    const msg = e.response?.data?.message || e.message;
    console.error(`[${stamp}] Comment sync failed: ${msg}`);
  }
}

main();
