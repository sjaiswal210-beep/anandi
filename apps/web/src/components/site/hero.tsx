'use client';

import { motion } from 'framer-motion';
import { MapPin, ShieldCheck, CalendarClock, ArrowRight } from 'lucide-react';
import { PROJECT, img } from './site-data';
import { useLanguage } from './language-context';

export function SiteHero() {
  const { t } = useLanguage();

  const highlights = [
    { value: '84', unit: t('unit.plots'), label: t('stats.plots') },
    { value: '1000–4510', unit: t('unit.sizes'), label: t('stats.sizes') },
    { value: '30 & 40', unit: t('unit.roads'), label: t('stats.roads') },
    { value: '100%', unit: t('unit.titles'), label: t('stats.titles') },
  ];

  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden bg-slate-950">
      {/* Background image + gradients */}
      <img
        src={img('ap-hero-land-aerial', 1920, 1200)}
        alt="Aerial view of Anandi Park residential plots"
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/50" />
      <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-5 pt-28 pb-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-medium tracking-wide text-amber-300">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t('hero.badge')}
          </span>

          <h1 className="mt-6 text-[2.2rem] font-bold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t('hero.title')}
          </h1>

          <p className="mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">
            {t('hero.sub')}
          </p>

          <div className="mt-7 flex flex-col gap-3 text-sm text-slate-300 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
              {t('hero.location')}
            </span>
            <span className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
              {t('hero.status')}
            </span>
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href="#contact"
              className="group flex items-center justify-center gap-2 rounded-full bg-amber-500 px-7 py-4 text-base font-medium text-slate-950 transition hover:bg-amber-400 sm:py-3.5"
            >
              {t('hero.cta')}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </a>
            <a
              href={`https://wa.me/${PROJECT.whatsapp}?text=${encodeURIComponent(
                `Hi, I am interested in ${PROJECT.name}. Please share plot details and pricing.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-4 text-base font-medium text-white transition hover:bg-white/10 sm:py-3.5"
            >
              {t('hero.whatsapp')}
            </a>
          </div>

          <p className="mt-8 text-sm text-slate-400">
            {t('hero.price')}
          </p>
        </motion.div>

        {/* Stats strip */}
        <motion.dl
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm lg:grid-cols-4"
        >
          {highlights.map((h) => (
            <div key={h.label} className="bg-slate-950/40 px-5 py-5 sm:px-6 sm:py-6">
              <dt className="text-[11px] uppercase tracking-wider text-slate-400">{h.label}</dt>
              <dd className="mt-1.5 text-xl font-semibold text-white sm:text-2xl">
                {h.value} <span className="text-xs font-normal text-amber-400 sm:text-sm">{h.unit}</span>
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
