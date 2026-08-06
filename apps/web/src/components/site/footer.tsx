'use client';

import { Building2, Phone, MessageCircle } from 'lucide-react';
import { PROJECT } from './site-data';

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 py-14">
      <div className="mx-auto max-w-7xl px-5">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5 text-white">
              <Building2 className="h-6 w-6 text-amber-400" aria-hidden="true" />
              <span className="text-lg font-semibold">{PROJECT.name}</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-slate-400">
              {PROJECT.tagline}. Developed by {PROJECT.builder}.
            </p>
            <p className="mt-4 text-xs text-slate-500">Clear titles · Ready for registration</p>
          </div>

          <nav aria-label="Footer">
            <h2 className="text-sm font-semibold text-white">Explore</h2>
            <ul className="mt-4 space-y-2.5">
              {[
                { href: '#overview', label: 'Overview' },
                { href: '#plans', label: 'Floor Plans' },
                { href: '#amenities', label: 'Amenities' },
                { href: '#gallery', label: 'Gallery' },
                { href: '#location', label: 'Location' },
              ].map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-slate-400 transition hover:text-amber-400">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold text-white">Get in touch</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              <li>
                <a href={`tel:${PROJECT.phone.replace(/\s/g, '')}`} className="hover:text-amber-400">
                  {PROJECT.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${PROJECT.email}`} className="hover:text-amber-400">
                  {PROJECT.email}
                </a>
              </li>
              <li>{PROJECT.location}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {PROJECT.builder}. All rights reserved.</p>
          <p>
            Images are artistic impressions. Powered by{' '}
            <span className="text-amber-400">Fame Developers</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export function FloatingActions() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <a
        href={`https://wa.me/${PROJECT.whatsapp}?text=${encodeURIComponent(
          `Hi, I am interested in ${PROJECT.name}. Please share details.`,
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] p-3.5 shadow-lg transition hover:scale-105"
        aria-label="Chat with us on WhatsApp"
      >
        <MessageCircle className="h-6 w-6 text-white" aria-hidden="true" />
      </a>
      <a
        href={`tel:${PROJECT.phone.replace(/\s/g, '')}`}
        className="flex items-center justify-center rounded-full bg-amber-500 p-3.5 shadow-lg transition hover:scale-105"
        aria-label="Call the sales team"
      >
        <Phone className="h-6 w-6 text-slate-950" aria-hidden="true" />
      </a>
    </div>
  );
}
