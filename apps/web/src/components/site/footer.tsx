'use client';

import { Phone } from 'lucide-react';
import { PROJECT } from './site-data';
import { useLanguage } from './language-context';

export function SiteFooter() {
  const { t } = useLanguage();

  const links = [
    { href: '#overview', label: t('nav.overview') },
    { href: '#plans', label: t('nav.plans') },
    { href: '#amenities', label: t('nav.amenities') },
    { href: '#gallery', label: t('gallery.tag') },
    { href: '#location', label: t('nav.location') },
  ];

  return (
    <footer className="border-t border-white/10 bg-slate-950 py-14">
      <div className="mx-auto max-w-7xl px-5">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/richland-transparent.png" alt="Rich-Land Developers" className="h-16 w-16 object-contain" />
            <p className="mt-4 max-w-xs text-sm text-slate-400 leading-relaxed font-semibold">
              {t('foot.sub')}
            </p>
            <p className="mt-4 text-xs text-slate-500 font-bold">{t('hero.badge')}</p>
          </div>

          <nav aria-label="Footer">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">{t('nav.overview')}</h2>
            <ul className="mt-4 space-y-2.5">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-slate-400 font-semibold transition hover:text-amber-400">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">{t('foot.getintouch')}</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400 font-semibold">
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
              <li>{t('hero.location')}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between font-medium">
          <p>© {new Date().getFullYear()} {PROJECT.builder} ({PROJECT.partners}). {t('foot.rights')}</p>
          <p>{t('foot.impress')}</p>
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
          className="h-8 w-8 text-white fill-current"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.05-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.401-.272.329-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.87 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.135-1.61a11.822 11.822 0 005.904 1.594h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
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
