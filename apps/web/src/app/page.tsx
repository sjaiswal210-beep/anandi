import { redirect } from 'next/navigation';

/**
 * Root router for the main domain (anandipark.in).
 *
 * - Ad clicks (Meta/Google append fbclid / gclid / utm_* / ad) → the
 *   lightweight /offer lead-capture page.
 * - Everyone else (organic, direct, SEO crawlers, AdSense review bot) → the
 *   full /project site, which is the content-rich, SEO-canonical homepage.
 *
 * The homepage must land on REAL content by default — pointing "/" at the bare
 * /offer form (as it did before) gets a Google AdSense rejection and hurts SEO.
 * /project carries the full site content, SEO metadata, JSON-LD, and lead popup
 * (via (site)/layout.tsx), so it is the right default destination.
 *
 * Next.js 15: searchParams is a Promise and must be awaited.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const isAdClick =
    'fbclid' in params ||
    'gclid' in params ||
    'utm_source' in params ||
    'utm_campaign' in params ||
    'ad' in params;

  if (!isAdClick) {
    redirect('/project');
  }

  // Ad traffic: preserve ad/utm params onto /offer so attribution isn't lost.
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') query.set(key, value);
    else if (Array.isArray(value) && value[0]) query.set(key, value[0]);
  }
  const suffix = query.toString() ? `?${query.toString()}` : '';
  redirect(`/offer${suffix}`);
}
