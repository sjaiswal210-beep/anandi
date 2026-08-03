'use client';

import { motion } from 'framer-motion';
import { MapPin, ShieldCheck, CalendarClock, ArrowRight } from 'lucide-react';
import { PROJECT, HIGHLIGHTS, img } from './site-data';

export function SiteHero() {
  return (
    <section id="top" className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background */}
      <img
        src={img('skh-hero-tower', 1920, 1200)}
        alt="Skyline Heights residential towers at dusk"
        className="absolute inset-0 h-full w-full object-cover opacity-55"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-5 pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-medium tracking-wide text-amber-300">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            MahaRERA {PROJECT.rera}
          </span>

          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Your land, your future at{' '}
            <span className="text-amber-400">Anandi Park</span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            {PROJECT.tagline}. Premium NA plots from 1000 to 5000 sq.ft. Clear titles, ready for registration.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-300">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-400" aria-hidden="true" />
              {PROJECT.location}
            </span>
            <span className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-amber-400" aria-hidden="true" />
              Possession {PROJECT.possession}
            </span>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#contact"
              className="group flex items-center gap-2 rounded-full bg-amber-500 px-7 py-3.5 font-medium text-slate-950 transition hover:bg-amber-400"
            >
              Schedule a Site Visit
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </a>
            <a
              href="#plans"
              className="rounded-full border border-white/20 px-7 py-3.5 font-medium text-white transition hover:bg-white/10"
            >
              View Floor Plans
            </a>
          </div>

          <p className="mt-8 text-sm text-slate-400">
            Starting at{' '}
            <span className="text-2xl font-semibold text-white">{PROJECT.priceFrom}</span>{' '}
            <span className="text-slate-500">(all inclusive)</span>
          </p>
        </motion.div>

        {/* Stats strip */}
        <motion.dl
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm lg:grid-cols-4"
        >
          {HIGHLIGHTS.map((h) => (
            <div key={h.label} className="bg-slate-950/40 px-6 py-6">
              <dt className="text-xs uppercase tracking-wider text-slate-400">{h.label}</dt>
              <dd className="mt-1.5 text-2xl font-semibold text-white">
                {h.value} <span className="text-sm font-normal text-amber-400">{h.unit}</span>
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
