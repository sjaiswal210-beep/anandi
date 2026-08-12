import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://anandipark.in'),
  title: {
    default: 'Anandi Park | Premium Residential Plots in Wagholi, Pune',
    template: '%s | Anandi Park',
  },
  description:
    'Anandi Park — 84 premium residential plots at Bakori, Wagholi-Bakori Road, Pune East. ' +
    'Starting ₹18 Lakh. Clear titles, gated layout, 30 & 40 ft wide roads. ' +
    'By Yuvraj Gade & Rajan Kute Developers. Book a free site visit today.',
  keywords: [
    'residential plots Wagholi',
    'plots for sale Pune',
    'Anandi Park Bakori',
    'residential plots Pune East',
    'plots near Kharadi',
    'land for sale Wagholi',
    'Yuvraj Gade Rajan Kute Developers',
    'affordable plots Pune',
    'gated plot layout Pune',
    'plots near Wagheshwar Temple',
  ],
  authors: [{ name: 'Yuvraj Gade & Rajan Kute Developers' }],
  creator: 'Anandi Park',
  publisher: 'Yuvraj Gade & Rajan Kute Developers',
  openGraph: {
    title: 'Anandi Park — Premium Residential Plots, Wagholi, Pune',
    description:
      '84 residential plots from ₹18 Lakh at Bakori, Wagholi. Clear titles, gated layout, wide roads. Book a free site visit.',
    url: 'https://anandipark.in',
    siteName: 'Anandi Park',
    images: [
      {
        url: '/site/og-cover.jpg',
        width: 1200,
        height: 630,
        alt: 'Aerial view of Anandi Park residential plots at Wagholi, Pune',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anandi Park — Residential Plots from ₹18 Lakh, Wagholi Pune',
    description: '84 plots, clear titles, gated layout. Book a free site visit.',
    images: ['/site/og-cover.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://anandipark.in/project',
  },
  verification: {
    // Add your Google Search Console verification code here after step below
    // google: 'your-verification-code',
  },
};

// JSON-LD structured data for rich snippets in Google
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: 'Anandi Park',
  description:
    '84 premium residential plots at Bakori, Wagholi-Bakori Road, Pune East. Starting ₹18 Lakh.',
  url: 'https://anandipark.in',
  image: 'https://anandipark.in/site/og-cover.jpg',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'GAT No. 279, Village Bakori, Wagholi-Bakori Road',
    addressLocality: 'Pune',
    addressRegion: 'Maharashtra',
    postalCode: '412207',
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '18.5918',
    longitude: '73.9900',
  },
  telephone: '+919999000001',
  priceRange: '₹18 Lakh - ₹83 Lakh',
  openingHours: 'Mo-Su 10:00-19:00',
  founder: {
    '@type': 'Organization',
    name: 'Yuvraj Gade & Rajan Kute Developers',
  },
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '1800000',
    highPrice: '8300000',
    priceCurrency: 'INR',
    offerCount: '84',
    availability: 'https://schema.org/InStock',
  },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </div>
  );
}
