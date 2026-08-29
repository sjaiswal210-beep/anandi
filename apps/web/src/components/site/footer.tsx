'use client';

import { Phone } from 'lucide-react';
import { PROJECT } from './site-data';

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 py-14">
      <div className="mx-auto max-w-7xl px-5">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/richland-transparent.png" alt="Rich-Land Developers" className="h-16 w-16 object-contain" />
            <p className="mt-4 max-w-xs text-sm text-slate-400">
              {PROJECT.name} — {PROJECT.tagline}. Developed by {PROJECT.builder} ({PROJECT.partners}).
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
          <p>© {new Date().getFullYear()} {PROJECT.builder} ({PROJECT.partners}). All rights reserved.</p>
          <p>Images are artistic impressions.</p>
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
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 text-white fill-current"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.05-.149-.669-1.612-.916-2.17-.24-.578-.485-.5-.669-.51-.183-.01-.393-.012-.602-.012-.208 0-.547.078-.833.477-.287.4-1.096 1.07-1.096 2.607 0 1.537 1.122 3.021 1.277 3.22 1.13 1.484 2.507 2.26 3.79 2.73.918.333 1.755.289 2.417.16.74-.145 2.274-.93 2.59-1.83.313-.9 1.144-1.848 1.15-2.008-.006-.16-.099-.24-.396-.39zM12 2.04a9.74 9.74 0 0 0-9.82 9.83c0 1.7.44 3.36 1.28 4.84l-.06-.17L2 22l5.42-1.42.12.07c1.42.84 3.03 1.29 4.69 1.29a9.74 9.74 0 0 0 9.83-9.83c0-2.61-1.02-5.07-2.87-6.93A9.713 9.713 0 0 0 12 2.04z" />
        </svg>
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
