import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/legal-page';
import { PROJECT } from '@/components/site/site-data';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Contact Anandi Park (Rich-Land Developers) — call, WhatsApp, or email us about residential plots at Bakori, Wagholi, Pune East.',
  alternates: { canonical: 'https://anandipark.in/contact' },
};

export default function ContactPage() {
  return (
    <LegalPage title="Contact Us">
      <p>
        We&rsquo;d love to help you find the right plot at {PROJECT.name}. Reach us
        through any of the options below — our team responds quickly during
        business hours (Mon&ndash;Sun, 10:00 AM&ndash;7:00 PM).
      </p>

      <h2>Phone</h2>
      <p>
        <a href={`tel:${PROJECT.phone.replace(/\s/g, '')}`}>{PROJECT.phone}</a>
      </p>

      <h2>WhatsApp</h2>
      <p>
        <a
          href={`https://wa.me/${PROJECT.whatsapp}?text=${encodeURIComponent(
            `Hi, I am interested in ${PROJECT.name}. Please share plot details.`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Chat with us on WhatsApp
        </a>
      </p>

      <h2>Email</h2>
      <p>
        <a href={`mailto:${PROJECT.email}`}>{PROJECT.email}</a>
      </p>

      <h2>Site address</h2>
      <p>{PROJECT.location}.</p>
      <p>
        <a href={PROJECT.mapSearch} target="_blank" rel="noopener noreferrer">
          Open location in Google Maps
        </a>
      </p>

      <h2>Developer</h2>
      <p>
        {PROJECT.builder} ({PROJECT.partners}).
      </p>

      <p>
        Prefer to browse first? Visit our <a href="/project">home page</a> for the
        full project overview, plot sizes, amenities, and gallery.
      </p>
    </LegalPage>
  );
}
