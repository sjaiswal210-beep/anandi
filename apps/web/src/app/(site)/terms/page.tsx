import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/legal-page';
import { PROJECT } from '@/components/site/site-data';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'The terms governing your use of the Anandi Park website by Rich-Land Developers.',
  alternates: { canonical: 'https://anandipark.in/terms' },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms &amp; Conditions" updated="October 2026">
      <p>
        These Terms &amp; Conditions govern your use of{' '}
        <a href="https://anandipark.in">anandipark.in</a> (the
        &ldquo;Site&rdquo;), operated by {PROJECT.builder} ({PROJECT.partners}).
        By accessing or using the Site, you agree to these terms. If you do not
        agree, please do not use the Site.
      </p>

      <h2>Use of the Site</h2>
      <ul>
        <li>The Site is provided for general information about the {PROJECT.name} residential plot project.</li>
        <li>You agree to use the Site lawfully and not to disrupt, misuse, or attempt to gain unauthorised access to it.</li>
        <li>You may submit your contact details only if they are accurate and belong to you.</li>
      </ul>

      <h2>Information accuracy</h2>
      <p>
        We make reasonable efforts to keep plot details, amenities, connectivity
        times, and offers up to date. However, all information on the Site is
        indicative and subject to change without notice. Images may include
        artistic or representative renders. Nothing on the Site constitutes a
        binding offer, a guarantee of returns, or legal, financial, or investment
        advice. Final details are confirmed in the official sale documentation.
      </p>

      <h2>Offers</h2>
      <p>
        Promotional offers (such as the limited-period &ldquo;{PROJECT.offer}
        &rdquo;) are subject to availability, eligibility, and the terms
        communicated at the time of booking, and may be withdrawn or changed at
        our discretion.
      </p>

      <h2>Intellectual property</h2>
      <p>
        All content on the Site — including text, logos, graphics, and images — is
        owned by or licensed to {PROJECT.builder} and may not be reproduced
        without permission.
      </p>

      <h2>Third-party links &amp; advertising</h2>
      <p>
        The Site may contain links to third-party websites and may display
        third-party advertisements (including via Google AdSense). We are not
        responsible for the content, policies, or practices of third-party sites
        or advertisers.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        The Site is provided &ldquo;as is&rdquo; without warranties of any kind.
        To the extent permitted by law, we are not liable for any loss arising
        from your use of, or reliance on, the Site.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India, with jurisdiction in the
        courts of Pune, Maharashtra.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Email{' '}
        <a href={`mailto:${PROJECT.email}`}>{PROJECT.email}</a> or call{' '}
        <a href={`tel:${PROJECT.phone.replace(/\s/g, '')}`}>{PROJECT.phone}</a>.
      </p>
    </LegalPage>
  );
}
