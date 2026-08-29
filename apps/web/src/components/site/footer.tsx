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
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition hover:scale-105 hover:bg-[#20ba5a]"
        aria-label="Chat with us on WhatsApp"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7 text-white fill-current"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12.012 2c-5.506 0-9.978 4.471-9.978 9.978 0 1.764.444 3.425 1.222 4.89l-1.256 4.588 5.016-1.22c1.42.77 3.023 1.22 4.996 1.22 5.506 0 9.978-4.472 9.978-9.978C21.99 6.471 17.518 2 12.012 2zm4.618 14.124c-.19.534-1.106 1.01-1.527 1.056-.379.043-.873.067-1.398-.126-.324-.118-.737-.29-1.636-.677-3.83-1.656-6.287-5.534-6.478-5.787-.19-.253-1.422-1.89-1.422-3.606 0-1.716.896-2.557 1.218-2.9.284-.29.626-.363.83-.363.167 0 .333.006.478.012.316.012.474.03.684.506.26.592.89 2.164.968 2.324.078.16.13.346.026.56-.104.214-.157.346-.312.527-.156.182-.328.404-.47.544-.16.155-.327.324-.14.64.186.313.827 1.363 1.77 2.202.943.838 1.74 1.1 1.99 1.223.25.12.395.1.543-.07.148-.17.64-.744.81-1 .17-.256.34-.216.574-.123.234.093 1.488.7 1.785.847.297.148.495.222.567.346.072.124.072.72-.118 1.254z" />
        </svg>
      </a>
      <a
        href={`tel:${PROJECT.phone.replace(/\s/g, '')}`}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 shadow-lg transition hover:scale-105 hover:bg-amber-400"
        aria-label="Call the sales team"
      >
        <Phone className="h-6 w-6 text-slate-950" aria-hidden="true" />
      </a>
    </div>
  );
}
