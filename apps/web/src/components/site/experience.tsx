'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Waves, Building, Dumbbell, Trees, Baby, Trophy, Laptop, Zap,
  Shield, Plug, Footprints, PartyPopper, Route, X,
} from 'lucide-react';
import { AMENITIES, GALLERY, img } from './site-data';
import { useLanguage } from './language-context';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  waves: Waves, building: Building, dumbbell: Dumbbell, trees: Trees,
  baby: Baby, trophy: Trophy, laptop: Laptop, zap: Zap,
  shield: Shield, plug: Plug, footprints: Footprints, party: PartyPopper,
  road: Route,
};

export function SiteAmenities() {
  const { t } = useLanguage();

  const amens = AMENITIES.map((a, i) => {
    const keys = [
      'amen.road', 'amen.gate', 'amen.water', 'amen.elect',
      'amen.drain', 'amen.garden', 'amen.kids', 'amen.security',
      'amen.wall', 'amen.lights', 'amen.trees', 'amen.open'
    ];
    return {
      ...a,
      name: t(keys[i]) || a.name
    };
  });

  return (
    <section id="amenities" className="relative overflow-hidden bg-slate-950 py-24">
      <img
        src={img('ap-amenity-bg-green', 1920, 1000)}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-slate-950/70" />

      <div className="relative mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-400">
            {t('amen.tag')}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl leading-tight">
            {t('amen.title')}
          </h2>
        </div>

        <ul className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {amens.map((a, i) => {
            const Icon = iconMap[a.icon] ?? Building;
            return (
              <motion.li
                key={a.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: (i % 8) * 0.05 }}
                className="group rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:border-amber-400/40 hover:bg-white/10"
              >
                <Icon className="h-6 w-6 text-amber-400 transition-transform group-hover:scale-110" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-white leading-snug">{a.name}</p>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function SiteGallery() {
  const [active, setActive] = useState<number | null>(null);
  const { t } = useLanguage();

  const galleryItems = GALLERY.map((g, i) => ({
    ...g,
    caption: t(`gallery.caption.${i}`) || g.caption
  }));

  return (
    <section id="gallery" className="bg-white py-24 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">
            {t('gallery.tag')}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white leading-tight">
            {t('gallery.title')}
          </h2>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleryItems.map((g, i) => (
            <motion.button
              key={g.seed}
              onClick={() => setActive(i)}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className="group relative overflow-hidden rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label={`Open ${g.caption} in full size`}
            >
              <img
                src={img(g.seed, 800, 600)}
                alt={g.caption}
                className="h-64 w-full bg-slate-100 object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-4 text-left text-xs sm:text-sm font-semibold text-white leading-snug">
                {g.caption}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {active !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 p-6"
          role="dialog"
          aria-modal="true"
          aria-label={galleryItems[active].caption}
          onClick={() => setActive(null)}
        >
          <button
            onClick={() => setActive(null)}
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
            aria-label="Close image viewer"
          >
            <X className="h-5 w-5" />
          </button>
          <figure onClick={(e) => e.stopPropagation()} className="max-w-4xl">
            <img
              src={img(galleryItems[active].seed, 1400, 950)}
              alt={galleryItems[active].caption}
              className="max-h-[78vh] w-full rounded-2xl object-contain"
            />
            <figcaption className="mt-4 text-center text-sm font-semibold text-slate-300">
              {galleryItems[active].caption}
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
