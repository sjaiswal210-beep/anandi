'use client';

import { motion } from 'framer-motion';
import { Check, Bed, Bath, Maximize2, ArrowRight } from 'lucide-react';
import { CONFIGURATIONS, PROJECT, img } from './site-data';

const reveal = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function SiteAbout() {
  return (
    <section id="overview" className="bg-white py-24 dark:bg-slate-950">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          <p className="text-sm font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">
            The Address
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Invest in land that grows with you
          </h2>
          <p className="mt-5 text-slate-600 dark:text-slate-400">
            {PROJECT.name} is a 5-acre plotted development by {PROJECT.builder}, offering
            premium NA plots with clear titles and all approvals in place.
            Every plot comes with ready infrastructure — roads, water, electricity, and drainage.
          </p>
          <ul className="mt-8 space-y-3.5">
            {[
              '100% NA (Non-Agricultural) approved plots',
              'Clear title — no legal disputes',
              'Ready infrastructure: roads, water, electricity',
              'RERA registered with transparent pricing',
              'Corner and road-facing premium plots available',
            ].map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                  <Check className="h-3 w-3 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                </span>
                <span className="text-sm text-slate-700 dark:text-slate-300">{point}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-2 gap-4"
        >
          <img
            src={img('skh-about-a', 700, 900)}
            alt="Landscaped central green at Skyline Heights"
            className="col-span-1 h-full rounded-2xl object-cover shadow-lg"
          />
          <div className="space-y-4">
            <img
              src={img('skh-about-b', 700, 500)}
              alt="Clubhouse interior lounge"
              className="rounded-2xl object-cover shadow-lg"
            />
            <img
              src={img('skh-about-c', 700, 500)}
              alt="Balcony view from a residence"
              className="rounded-2xl object-cover shadow-lg"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function SitePlans() {
  return (
    <section id="plans" className="bg-slate-50 py-24 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Configurations
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Choose your floor plan
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Carpet areas are stated as per RERA. Balcony and terrace are listed
            separately in the cost sheet.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {CONFIGURATIONS.map((c, i) => (
            <motion.article
              key={c.type}
              variants={reveal}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.1 }}
              className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-xl dark:bg-slate-950 ${
                c.featured
                  ? 'border-amber-500 ring-1 ring-amber-500'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="relative">
                <img
                  src={img(c.seed, 800, 560)}
                  alt={`${c.type} floor plan layout`}
                  className="h-52 w-full bg-slate-100 object-cover"
                />
                {c.featured && (
                  <span className="absolute right-4 top-4 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-slate-950">
                    Most popular
                  </span>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{c.type}</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {c.available} homes left
                  </span>
                </div>

                <p className="mt-2 text-lg font-medium text-amber-600 dark:text-amber-400">{c.price}</p>

                <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <div className="text-center">
                    <Maximize2 className="mx-auto h-4 w-4 text-slate-400" aria-hidden="true" />
                    <dt className="sr-only">Carpet area</dt>
                    <dd className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">{c.carpet}</dd>
                  </div>
                  <div className="text-center">
                    <Bed className="mx-auto h-4 w-4 text-slate-400" aria-hidden="true" />
                    <dt className="sr-only">Bedrooms</dt>
                    <dd className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">{c.beds} Beds</dd>
                  </div>
                  <div className="text-center">
                    <Bath className="mx-auto h-4 w-4 text-slate-400" aria-hidden="true" />
                    <dt className="sr-only">Bathrooms</dt>
                    <dd className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">{c.baths} Baths</dd>
                  </div>
                </dl>

                <a
                  href="#contact"
                  className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  Request cost sheet
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </a>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
