import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/site/legal-page';
import { ARTICLES } from '@/components/site/blog-data';

export const metadata: Metadata = {
  title: 'Site Directory & HTML Sitemap',
  description:
    'Complete page directory and sitemap for Anandi Park website — explore project overview, blog guides, real estate tools, and legal policies.',
  alternates: { canonical: 'https://anandipark.in/sitemap-page' },
};

export default function HtmlSitemapPage() {
  return (
    <LegalPage title="Site Directory &amp; Sitemap">
      <p>
        Welcome to the site directory for <strong>Anandi Park</strong> (<a href="https://anandipark.in">anandipark.in</a>), developed by Rich-Land Developers. Use the index below to quickly navigate all project pages, guides, tools, and legal policies.
      </p>

      <h2>Main Project Pages</h2>
      <ul>
        <li>
          <Link href="/project">Anandi Park Project Overview</Link> — 84 residential plots at Bakori, Wagholi Pune.
        </li>
        <li>
          <Link href="/about">About Us</Link> — Learn about Rich-Land Developers (Yuvraj Gade &amp; Rajan Kute).
        </li>
        <li>
          <Link href="/contact">Contact Us</Link> — Phone numbers, site map, and booking office address.
        </li>
      </ul>

      <h2>Real Estate Blog &amp; Educational Guides</h2>
      <ul>
        <li>
          <Link href="/blog">Real Estate Blog Index</Link>
        </li>
        {ARTICLES.map((art) => (
          <li key={art.slug}>
            <Link href={`/blog/${art.slug}`}>{art.title}</Link>
          </li>
        ))}
      </ul>

      <h2>Interactive Calculators &amp; Utilities</h2>
      <ul>
        <li>
          <Link href="/tools">Tools Hub</Link>
        </li>
        <li>
          <Link href="/tools/emi-calculator">Plot Loan EMI Calculator</Link>
        </li>
        <li>
          <Link href="/tools/stamp-duty-calculator">Stamp Duty &amp; Registration Fee Calculator (Pune)</Link>
        </li>
        <li>
          <Link href="/tools/plot-area-converter">Land Unit Converter (Guntha ↔ Sq Ft)</Link>
        </li>
      </ul>

      <h2>Legal Policies &amp; Terms</h2>
      <ul>
        <li>
          <Link href="/privacy">Privacy Policy &amp; Cookie Disclosure</Link>
        </li>
        <li>
          <Link href="/terms">Terms &amp; Conditions</Link>
        </li>
        <li>
          <Link href="/disclaimer">Real Estate Disclaimer</Link>
        </li>
      </ul>
    </LegalPage>
  );
}