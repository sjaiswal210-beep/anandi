import { redirect } from 'next/navigation';

/**
 * Root router for the main domain.
 *
 * - Ad clicks (Meta appends fbclid / utm_* / gclid) → the lightweight /offer
 *   landing page for fast lead capture.
 * - Everyone else (organic, direct, SEO) → the full /project site.
 *
 * This keeps SEO intact (Google indexes /project) while sending paid traffic
 * straight to the high-converting offer form, even if the ad points at the bare
 * domain instead of /offer.
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

  redirect(isAdClick ? '/offer' : '/project');
}
