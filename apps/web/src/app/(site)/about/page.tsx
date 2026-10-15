import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/legal-page';
import { PROJECT, HIGHLIGHTS } from '@/components/site/site-data';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'About Anandi Park and Rich-Land Developers — premium residential plots at Bakori, Wagholi, Pune East, by Yuvraj Gade & Rajan Kute.',
  alternates: { canonical: 'https://anandipark.in/about' },
};

export default function AboutPage() {
  return (
    <LegalPage title="About Us">
      <p>
        <strong>{PROJECT.name}</strong> is a premium residential plot project at{' '}
        {PROJECT.location}, developed by <strong>{PROJECT.builder}</strong> — a
        partnership of {PROJECT.partners}. Our goal is simple: offer families and
        investors clear-title, construction-ready plots in one of Pune East&rsquo;s
        fastest-growing corridors, with an honest, end-to-end buying experience.
      </p>

      <h2>The project at a glance</h2>
      <ul>
        {HIGHLIGHTS.map((h) => (
          <li key={h.label}>
            <strong>{h.value} {h.unit}</strong> — {h.label}
          </li>
        ))}
        <li>Gated, planned layout with 30 &amp; 40 ft wide internal roads.</li>
        <li>Within municipal (Mahanagarpalika) limits, with drainage, electricity, and street lighting.</li>
        <li>Just 500 m from the Pune Ring Road, minutes from schools, colleges, and the Kharadi IT hub.</li>
      </ul>

      <h2>Why Rich-Land Developers</h2>
      <p>
        We focus on transparency and trust. Every plot at {PROJECT.name} comes
        with a clean, marketable title and complete documentation that we walk you
        through before you book. We assist with home-loan tie-ups and handle
        registration paperwork end to end, so your purchase is smooth and
        hassle-free.
      </p>

      <h2>Our commitment</h2>
      <p>
        From your first enquiry to the day your plot is registered, our team is
        available to answer questions, arrange free site visits (including
        weekends, with pickup within Pune city limits), and guide you through each
        step. We believe a land purchase should be clear, confident, and
        well-informed.
      </p>

      <h2>Visit or reach us</h2>
      <p>
        Site address: {PROJECT.location}. Call{' '}
        <a href={`tel:${PROJECT.phone.replace(/\s/g, '')}`}>{PROJECT.phone}</a>,
        email <a href={`mailto:${PROJECT.email}`}>{PROJECT.email}</a>, or message
        us on{' '}
        <a href={`https://wa.me/${PROJECT.whatsapp}`} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        . See the full project details on our{' '}
        <a href="/project">home page</a>.
      </p>
    </LegalPage>
  );
}
