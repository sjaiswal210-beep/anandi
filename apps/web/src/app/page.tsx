import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { LEAD_CAPTURED_COOKIE } from '@/components/site/site-api';

/**
 * Root router for the main domain.
 *
 * - Every NEW visitor (no "already submitted a lead" cookie) → the lightweight
 *   /offer landing page for fast lead capture, regardless of how they arrived
 *   (ad click, organic, direct).
 * - A visitor whose browser already has the lead-captured cookie (they filled
 *   the offer/popup form before) → straight to the full /project site, no
 *   detour through /offer again.
 *
 * /project itself stays directly reachable (deep links, SEO crawlers hitting
 * that URL specifically still see the full site) — this gate only applies to
 * the bare domain "/".
 *
 * Next.js 15: searchParams is a Promise and must be awaited.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Keep forwarding ad/query params onto /offer so attribution isn't lost.
  const params = (await searchParams) || {};
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') query.set(key, value);
    else if (Array.isArray(value) && value[0]) query.set(key, value[0]);
  }
  const suffix = query.toString() ? `?${query.toString()}` : '';

  const cookieStore = await cookies();
  const alreadyCaptured = cookieStore.get(LEAD_CAPTURED_COOKIE)?.value === 'yes';

  redirect(alreadyCaptured ? '/project' : `/offer${suffix}`);
}
