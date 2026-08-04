'use client';

import { useEffect, useState } from 'react';
import { Building2, Menu, X, Phone } from 'lucide-react';
import { PROJECT } from './site-data';

const links = [
  { href: '#overview', label: 'Overview' },
  { href: '#plans', label: 'Plot Sizes' },
  { href: '#amenities', label: 'Amenities' },
  { href: '#location', label: 'Location' },
  { href: '#blog', label: 'Insights' },
  { href: '#contact', label: 'Contact' },
];

export function SiteNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-slate-950/85 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4" aria-label="Main">
        <a href="#top" className="flex items-center gap-2.5 text-white">
          <Building2 className="h-7 w-7 text-amber-400" />
          <span className="text-lg font-semibold tracking-tight">{PROJECT.name}</span>
        </a>

        <ul className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm text-slate-200 transition-colors hover:text-amber-400"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={`tel:${PROJECT.phone.replace(/\s/g, '')}`}
            className="flex items-center gap-2 text-sm text-slate-200 hover:text-white"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {PROJECT.phone}
          </a>
          <a
            href="#contact"
            className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-amber-400"
          >
            Book a Visit
          </a>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-white lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/10 bg-slate-950/95 px-5 py-4 lg:hidden">
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm text-slate-200 hover:bg-white/5"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#contact"
            onClick={() => setOpen(false)}
            className="mt-3 block rounded-full bg-amber-500 px-5 py-3 text-center text-sm font-medium text-slate-950"
          >
            Book a Visit
          </a>
        </div>
      )}
    </header>
  );
}
