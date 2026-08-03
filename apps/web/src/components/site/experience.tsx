'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Waves, Building, Dumbbell, Trees, Baby, Trophy, Laptop, Zap,
  Shield, Plug, Footprints, PartyPopper, X,
} from 'lucide-react';
import { AMENITIES, GALLERY, img } from './site-data';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  waves: Waves, building: Building, dumbbell: Dumbbell, trees: Trees,
  baby: Baby, trophy: Trophy, laptop: Laptop, zap: Zap,
  shield: Shield, plug: Plug, footprints: Footprints, party: PartyPopper,
};

export function SiteAmenities() {
  return (
    <section id="amenities" className="relative overflow-hidden bg-slate-950 py-24">
      <img
        src={img('skh-amenity-bg', 1920, 1000)}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-slate-950/70" />

      <div className="relative mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-400">
            Lifestyle
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Everything in place, ready to build
          </h2>
          <p className="mt-4 text-slate-400">
            Complete infrastructure already set up — internal roads, water, electricity,
            drainage, and landscaped entry. Move in and start building your dream.
          </p>
        </div>

        <ul className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {AMENITIES.map((a, i) => {
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
                <p className="mt-3 text-sm font-medium text-white">{a.name}</p>
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

  return (
    <section id="gallery" className="bg-white py-24 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Gallery
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Take a closer look
          </h2>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GALLERY.map((g, i) => (
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
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-4 text-left text-sm font-medium text-white">
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
          aria-label={GALLERY[active].caption}
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
              src={img(GALLERY[active].seed, 1400, 950)}
              alt={GALLERY[active].caption}
              className="max-h-[78vh] w-full rounded-2xl object-contain"
            />
            <figcaption className="mt-4 text-center text-sm text-slate-300">
              {GALLERY[active].caption}
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
