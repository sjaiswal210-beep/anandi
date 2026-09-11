/**
 * Fixes stale / false content in the Website DB record for Anandi Park.
 *
 * The stored SEO + config still says "NA plots", "RERA registered",
 * "Rs 15 Lac", a dummy phone, and a misspelled builder. Project rules:
 *   - "residential plots" (NEVER "NA plots")
 *   - NO RERA claim anywhere
 *   - price ₹18 Lakh+ (not ₹15)
 *   - contact +91 75584 44117
 *   - builder "Rich-Land Developers" (Yuvraj Gade & Rajan Kute)
 *
 * Safe + idempotent: reads the current row, patches only the affected fields,
 * leaves everything else intact. Dry-run by default; pass --confirm to write.
 *
 * Usage (reads DATABASE_URL from the environment):
 *   node scripts/fix-website-seo.cjs            # dry run, shows the diff
 *   node scripts/fix-website-seo.cjs --confirm  # apply
 */
const { PrismaClient } = require('@prisma/client');

const SUBDOMAIN = 'anandi-park';
const CONFIRM = process.argv.includes('--confirm');

const CORRECT = {
  builder: 'Rich-Land Developers',
  phone: '+91 75584 44117',
  email: 'sales@anandipark.in',
  address: 'Bakori, Wagholi, Pune East, Maharashtra',
  seoTitle: 'Anandi Park | Premium Residential Plots by Rich-Land Developers, Pune',
  seoDescription:
    'Premium residential plots from 1000 to 4510 sq.ft in Bakori, Wagholi (Pune East). ' +
    'Clear titles, gated & planned layout, ready for construction. Starting at ₹18 Lakh.',
  seoKeywords: [
    'residential plots Pune',
    'plots in Wagholi',
    'plots in Bakori Pune',
    'Anandi Park',
    'Rich-Land Developers',
    'land for sale Pune East',
  ],
};

(async () => {
  const prisma = new PrismaClient();
  try {
    const site = await prisma.website.findFirst({ where: { subdomain: SUBDOMAIN } });
    if (!site) {
      console.log(`No Website row with subdomain "${SUBDOMAIN}" found.`);
      return;
    }

    const config = { ...(site.config || {}) };
    config.builder = CORRECT.builder;
    config.contactInfo = {
      ...(config.contactInfo || {}),
      phone: CORRECT.phone,
      email: CORRECT.email,
      address: CORRECT.address,
    };

    const seoConfig = {
      ...(site.seoConfig || {}),
      title: CORRECT.seoTitle,
      description: CORRECT.seoDescription,
      keywords: CORRECT.seoKeywords,
    };

    console.log('=== BEFORE ===');
    console.log('builder :', site.config?.builder);
    console.log('phone   :', site.config?.contactInfo?.phone);
    console.log('title   :', site.seoConfig?.title);
    console.log('desc    :', site.seoConfig?.description);
    console.log('keywords:', JSON.stringify(site.seoConfig?.keywords));
    console.log('\n=== AFTER ===');
    console.log('builder :', config.builder);
    console.log('phone   :', config.contactInfo.phone);
    console.log('title   :', seoConfig.title);
    console.log('desc    :', seoConfig.description);
    console.log('keywords:', JSON.stringify(seoConfig.keywords));

    // Sanity: assert no banned content remains.
    const blob = JSON.stringify({ config, seoConfig }).toLowerCase();
    const banned = ['na plot', 'rera', '15 lac', '15 lakh', '99990 00001'];
    const hits = banned.filter((b) => blob.includes(b));
    if (hits.length) {
      console.log('\n⚠ Banned content still present after patch:', hits.join(', '));
    } else {
      console.log('\n✓ No banned content (NA plots / RERA / ₹15 / dummy phone) in the new values.');
    }

    if (!CONFIRM) {
      console.log('\nDry run. Re-run with --confirm to apply.');
      return;
    }

    await prisma.website.update({
      where: { id: site.id },
      data: { config, seoConfig },
    });
    console.log('\n✅ Website record updated.');
  } catch (e) {
    console.log('ERROR:', e.message.split('\n')[0]);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
