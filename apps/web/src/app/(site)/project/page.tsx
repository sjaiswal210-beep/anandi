import { SiteNavbar } from '@/components/site/navbar';
import { SiteHero } from '@/components/site/hero';
import { SiteAbout, SitePlans } from '@/components/site/about-plans';
import { SiteAmenities, SiteGallery } from '@/components/site/experience';
import { SiteVideoTour } from '@/components/site/video-tour';
import { SiteLocation, SiteTestimonials, SiteFaq } from '@/components/site/location-trust';
import { SiteBlog, SiteSocial } from '@/components/site/blog-social';
import { SiteContact } from '@/components/site/contact';
import { SiteFooter, FloatingActions } from '@/components/site/footer';

export default function ProjectWebsitePage() {
  return (
    <>
      <SiteNavbar />
      <main>
        <SiteHero />
        <SiteAbout />
        <SitePlans />
        <SiteAmenities />
        <SiteGallery />
        <SiteVideoTour />
        <SiteLocation />
        <SiteTestimonials />
        <SiteBlog />
        <SiteSocial />
        <SiteFaq />
        <SiteContact />
      </main>
      <SiteFooter />
      <FloatingActions />
    </>
  );
}
