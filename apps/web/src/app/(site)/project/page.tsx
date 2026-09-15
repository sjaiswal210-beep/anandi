'use client';

import dynamic from 'next/dynamic';
import { LanguageProvider } from '@/components/site/language-context';
import { SiteNavbar } from '@/components/site/navbar';
import { SiteHero } from '@/components/site/hero';
import { SiteAbout, SitePlans } from '@/components/site/about-plans';

// Above-the-fold (navbar, hero, about, plans) load immediately.
// Everything below the fold is lazy-loaded so the initial page is light and
// fast; each section's JS + assets only download as the visitor scrolls near it.
const sectionLoading = () => (
  <div className="min-h-[40vh] w-full animate-pulse bg-slate-100 dark:bg-slate-900/40" />
);

const SiteAmenities = dynamic(
  () => import('@/components/site/experience').then((m) => m.SiteAmenities),
  { loading: sectionLoading },
);
const SiteGallery = dynamic(
  () => import('@/components/site/experience').then((m) => m.SiteGallery),
  { loading: sectionLoading },
);
const SiteLocation = dynamic(
  () => import('@/components/site/location-trust').then((m) => m.SiteLocation),
  { loading: sectionLoading },
);
const SiteTestimonials = dynamic(
  () => import('@/components/site/location-trust').then((m) => m.SiteTestimonials),
  { loading: sectionLoading },
);
const SiteFaq = dynamic(
  () => import('@/components/site/location-trust').then((m) => m.SiteFaq),
  { loading: sectionLoading },
);
const SiteBlog = dynamic(
  () => import('@/components/site/blog-social').then((m) => m.SiteBlog),
  { loading: sectionLoading },
);
const SiteSocial = dynamic(
  () => import('@/components/site/blog-social').then((m) => m.SiteSocial),
  { loading: sectionLoading },
);
const SiteContact = dynamic(
  () => import('@/components/site/contact').then((m) => m.SiteContact),
  { loading: sectionLoading },
);
const SiteFooter = dynamic(
  () => import('@/components/site/footer').then((m) => m.SiteFooter),
);
const FloatingActions = dynamic(
  () => import('@/components/site/footer').then((m) => m.FloatingActions),
  { ssr: false },
);

export default function ProjectWebsitePage() {
  return (
    <LanguageProvider>
      <SiteNavbar />
      <main>
        <SiteHero />
        <SiteAbout />
        <SitePlans />
        <SiteAmenities />
        <SiteGallery />
        <SiteLocation />
        <SiteTestimonials />
        <SiteBlog />
        <SiteSocial />
        <SiteFaq />
        <SiteContact />
      </main>
      <SiteFooter />
      <FloatingActions />
    </LanguageProvider>
  );
}
