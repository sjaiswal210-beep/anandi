'use client';

import { useEffect, useState } from 'react';
import { Menu, X, Phone, Globe, ChevronDown } from 'lucide-react';
import { PROJECT } from './site-data';
import { useLanguage } from './language-context';

export function SiteNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const { language, setLanguage, t } = useLanguage();

  const links = [
    { href: '#overview', label: t('nav.overview') },
    { href: '#plans', label: t('nav.plans') },
    { href: '#amenities', label: t('nav.amenities') },
    { href: '#location', label: t('nav.location') },
    { href: '#blog', label: t('nav.insights') },
    { href: '#contact', label: t('nav.contact') },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const currentLangLabel = 
    language === 'mr' ? 'मराठी' : language === 'hi' ? 'हिंदी' : 'English';

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-slate-950/85 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4" aria-label="Main">
        <a href="#top" className="flex items-center gap-3 text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/richland-transparent.png" alt="Rich-Land Developers" className="h-10 w-10 object-contain" />
          <span className="leading-tight">
            <span className="block text-lg font-semibold tracking-tight">{PROJECT.name}</span>
            <span className="block text-[11px] text-slate-400">by {PROJECT.builder}</span>
          </span>
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

        <div className="hidden items-center gap-4 lg:flex">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/60 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              <Globe className="h-3.5 w-3.5 text-amber-500" />
              {currentLangLabel}
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-28 rounded-xl border border-slate-800 bg-slate-950 p-1.5 shadow-xl z-50">
                {[
                  { code: 'mr', label: 'मराठी' },
                  { code: 'hi', label: 'हिंदी' },
                  { code: 'en', label: 'English' }
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code as any);
                      setLangOpen(false);
                    }}
                    className={`w-full text-left rounded-lg px-3 py-2 text-xs font-medium transition ${
                      language === lang.code 
                        ? 'bg-amber-500 text-slate-950 font-semibold' 
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

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
            {t('nav.book')}
          </a>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          {/* Mobile Language Selector button */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-300"
            >
              <Globe className="h-3.5 w-3.5 text-amber-500" />
              {currentLangLabel}
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-28 rounded-xl border border-slate-800 bg-slate-950 p-1.5 shadow-xl z-50">
                {[
                  { code: 'mr', label: 'मराठी' },
                  { code: 'hi', label: 'हिंदी' },
                  { code: 'en', label: 'English' }
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code as any);
                      setLangOpen(false);
                    }}
                    className={`w-full text-left rounded-lg px-3 py-2 text-xs font-medium transition ${
                      language === lang.code 
                        ? 'bg-amber-500 text-slate-950 font-semibold' 
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 text-white"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
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
            {t('nav.book')}
          </a>
        </div>
      )}
    </header>
  );
}
