import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/legal-page';
import { PROJECT } from '@/components/site/site-data';

export const metadata: Metadata = {
  title: 'Real Estate Disclaimer',
  description:
    'Legal disclaimer regarding property information, artistic renders, pricing, and advertising policy on Anandi Park website.',
  alternates: { canonical: 'https://anandipark.in/disclaimer' },
};

export default function DisclaimerPage() {
  return (
    <LegalPage title="Real Estate Disclaimer" updated="October 2026">
      <p>
        The information provided on <a href="https://anandipark.in">anandipark.in</a> (the &ldquo;Site&rdquo;) by {PROJECT.builder} ({PROJECT.partners}) is for general informational and educational purposes only.
      </p>

      <h2>1. Property Information &amp; Renderings</h2>
      <p>
        All site layout plans, plot dimensions, floor plans, area measurements, 3D renders, aerial images, and architectural illustrations shown on this website are conceptual representations. Actual site dimensions and boundary demarcations are governed strictly by the final government revenue survey maps and official registered sale agreement documents.
      </p>

      <h2>2. Pricing &amp; Promotional Offers</h2>
      <p>
        Plot prices, government taxes, stamp duty rates, registration charges, and promotional offers (including the &ldquo;{PROJECT.offer}&rdquo; offer) are subject to revision without prior notice. Final pricing is confirmed at the time of executing the formal booking agreement.
      </p>

      <h2>3. Third-Party Advertising &amp; Google AdSense</h2>
      <p>
        This website displays advertisements provided by third-party advertising networks, including Google AdSense. Ads are served based on user interests and cookies. Rich-Land Developers does not endorse or guarantee third-party products or services advertised on the site.
      </p>

      <h2>4. Contact Information</h2>
      <p>
        For official verification of plot papers, title search reports, or 7/12 extract records, please contact our legal desk at{' '}
        <a href={`mailto:${PROJECT.email}`}>{PROJECT.email}</a> or call <a href={`tel:${PROJECT.phone.replace(/\s/g, '')}`}>{PROJECT.phone}</a>.
      </p>
    </LegalPage>
  );
}