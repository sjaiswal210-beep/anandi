'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Quote, ChevronDown, Star } from 'lucide-react';
import { NEARBY, TESTIMONIALS, FAQS, PROJECT, img } from './site-data';

export function SiteLocation() {
  return (
    <section id="location" className="bg-slate-50 py-24 dark:bg-slate-900">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Location
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Strategic location, connected living
          </h2>
          <p className="mt-4 flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <MapPin className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
            {PROJECT.location}
          </p>

          <ul className="mt-8 divide-y divide-slate-200 dark:divide-slate-800">
            {NEARBY.map((n, i) => (
              <motion.li
                key={n.place}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="flex items-center justify-between gap-3 py-3.5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-slate-700 dark:text-slate-300">{n.place}</span>
                  {n.note && (
                    <span className="block text-xs text-slate-400">{n.note}</span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-white">
                  <Clock className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                  {n.time}
                </span>
              </motion.li>
            ))}
          </ul>

          <a
            href="https://www.google.com/maps/search/Bakori+Wagholi+Pune"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-900 transition hover:bg-white dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
          >
            Open in Google Maps
          </a>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="overflow-hidden rounded-2xl shadow-xl"
        >
          <iframe
            src={PROJECT.mapEmbed}
            title="Anandi Park location on the map"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[380px] w-full border-0 lg:h-full"
            allowFullScreen
          />
        </motion.div>
      </div>
    </section>
  );
}

export function SiteTestimonials() {
  return (
    <section className="bg-white py-24 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Testimonials
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            What our residents say
          </h2>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-7 dark:border-slate-800 dark:bg-slate-900"
            >
              <Quote className="h-7 w-7 text-amber-500/40" aria-hidden="true" />
              <blockquote className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {t.text}
              </blockquote>
              <div className="mt-5 flex gap-0.5" aria-label="Rated 5 out of 5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
                ))}
              </div>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                <img
                  src={img(t.seed, 96, 96)}
                  alt=""
                  aria-hidden="true"
                  className="h-10 w-10 rounded-full bg-slate-200 object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SiteFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-slate-50 py-24 dark:bg-slate-900">
      <div className="mx-auto max-w-3xl px-5">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Questions buyers ask us
          </h2>
        </div>

        <dl className="mt-12 space-y-3">
          {FAQS.map((f, i) => (
            <div
              key={f.q}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
            >
              <dt>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={open === i}
                >
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{f.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                      open === i ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </dt>
              {open === i && (
                <dd className="px-6 pb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {f.a}
                </dd>
              )}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
