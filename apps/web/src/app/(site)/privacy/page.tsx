import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/legal-page';
import { PROJECT } from '@/components/site/site-data';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Anandi Park (Rich-Land Developers) collects, uses, and protects your personal information, including cookies and third-party advertising.',
  alternates: { canonical: 'https://anandipark.in/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 2026">
      <p>
        This Privacy Policy explains how {PROJECT.builder} ({PROJECT.partners}),
        the developer of the {PROJECT.name} residential plot project
        (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), collects, uses,
        and safeguards your information when you visit{' '}
        <a href="https://anandipark.in">anandipark.in</a> (the
        &ldquo;Site&rdquo;). By using the Site you agree to the practices
        described here.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Information you provide:</strong> your name, mobile number, and
          any message you submit through our enquiry forms, lead-capture pop-up,
          WhatsApp, or call links. We collect this only to respond to your
          interest in our plots.
        </li>
        <li>
          <strong>Information collected automatically:</strong> standard log data
          such as your browser type, device, approximate location, pages viewed,
          and the time of your visit, gathered through cookies and similar
          technologies.
        </li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To contact you about {PROJECT.name} plots, pricing, offers, and site visits that you requested.</li>
        <li>To respond to your enquiries and provide customer support.</li>
        <li>To improve the Site&rsquo;s content, performance, and user experience.</li>
        <li>To comply with applicable legal obligations.</li>
      </ul>
      <p>
        We do <strong>not</strong> sell your personal information. We only use the
        contact details you share to communicate about our real-estate offering.
      </p>

      <h2>Cookies</h2>
      <p>
        The Site uses cookies and local browser storage to remember your
        preferences (for example, whether you have already submitted an enquiry so
        we do not show the pop-up again) and to understand how visitors use the
        Site. You can disable cookies in your browser settings, though some
        features may not work as intended.
      </p>

      <h2>Third-party advertising &amp; Google AdSense</h2>
      <p>
        We may display advertisements served by third-party vendors, including
        Google. These vendors use cookies to serve ads based on your prior visits
        to this and other websites.
      </p>
      <ul>
        <li>
          Google, as a third-party vendor, uses cookies (including the DoubleClick
          cookie) to serve ads based on your visits to this Site and other sites
          on the internet.
        </li>
        <li>
          You may opt out of personalised advertising by visiting{' '}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
            Google Ads Settings
          </a>
          .
        </li>
        <li>
          You can learn more about how Google uses data at{' '}
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
            Google&rsquo;s Privacy &amp; Terms
          </a>
          , and opt out of third-party vendor cookies at{' '}
          <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">
            aboutads.info
          </a>
          .
        </li>
      </ul>

      <h2>Data retention &amp; security</h2>
      <p>
        We retain your enquiry details only as long as needed to serve your
        interest in our project and for legitimate business or legal purposes. We
        apply reasonable technical and organisational measures to protect your
        information, though no method of transmission over the internet is fully
        secure.
      </p>

      <h2>Your rights</h2>
      <p>
        You may request access to, correction of, or deletion of the personal
        information you have shared with us by contacting us using the details
        below.
      </p>

      <h2>Contact us</h2>
      <p>
        For any privacy-related questions, email{' '}
        <a href={`mailto:${PROJECT.email}`}>{PROJECT.email}</a> or call{' '}
        <a href={`tel:${PROJECT.phone.replace(/\s/g, '')}`}>{PROJECT.phone}</a>.
        Address: {PROJECT.location}.
      </p>
    </LegalPage>
  );
}
