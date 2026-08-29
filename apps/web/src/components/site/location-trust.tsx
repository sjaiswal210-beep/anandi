'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Quote, ChevronDown, Star } from 'lucide-react';
import { NEARBY, CONNECTIVITY, TESTIMONIALS, FAQS, PROJECT, img } from './site-data';
import { useLanguage } from './language-context';

export function SiteLocation() {
  const { t } = useLanguage();

  const connectivityPoints = CONNECTIVITY.map((c, i) => ({
    ...c,
    place: t(`loc.conn.${i}`) || c.place
  }));

  const nearbyPoints = NEARBY.map((n, i) => ({
    ...n,
    place: t(`loc.nearby.place.${i}`) || n.place,
    note: n.note ? t(`loc.nearby.note.${i}`) : undefined
  }));

  return (
    <section id="location" className="bg-slate-50 py-20 dark:bg-slate-900 sm:py-24">
      {/* Connectivity highlight band */}
      <div className="mx-auto mb-16 max-w-7xl px-5">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-emerald-50 p-6 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-emerald-950/20 sm:grid-cols-4">
          {connectivityPoints.map((c) => (
            <motion.div
              key={c.place}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 sm:text-3xl">{c.time}</p>
              <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400 sm:text-sm">{c.place}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">
            {t('loc.tag')}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white leading-tight">
            {t('loc.title')}
          </h2>
          <p className="mt-4 flex items-center gap-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            <MapPin className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
            {t('hero.location')}
          </p>

          <ul className="mt-8 divide-y divide-slate-200 dark:divide-slate-800">
            {nearbyPoints.map((n, i) => (
              <motion.li
                key={n.place}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="flex items-center justify-between gap-3 py-3.5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-700 dark:text-slate-300 leading-snug">{n.place}</span>
                  {n.note && (
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.note}</span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  <Clock className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                  {n.time}
                </span>
              </motion.li>
            ))}
          </ul>

          <a
            href={PROJECT.mapSearch}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-900 bg-white shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
          >
            {t('loc.btn')}
          </a>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="overflow-hidden rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800"
        >
          <iframe
            src={PROJECT.mapEmbed}
            title="Anandi Park location on the map"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[380px] w-full border-0 lg:h-[480px]"
            allowFullScreen
          />
        </motion.div>
      </div>
    </section>
  );
}

export function SiteTestimonials() {
  const { t } = useLanguage();

  const reviews = TESTIMONIALS.map((te, i) => ({
    ...te,
    text: t(`test.text.${i}`) || te.text,
    role: t(`test.role.${i}`) || te.role
  }));

  return (
    <section className="bg-white py-24 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">
            {t('test.tag')}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white leading-tight">
            {t('test.title')}
          </h2>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {reviews.map((te, i) => (
            <motion.figure
              key={te.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-7 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
            >
              <div>
                <Quote className="h-7 w-7 text-amber-500/40" aria-hidden="true" />
                <blockquote className="mt-4 text-xs sm:text-sm leading-relaxed font-medium text-slate-700 dark:text-slate-300">
                  &ldquo;{te.text}&rdquo;
                </blockquote>
              </div>
              <div>
                <div className="mt-5 flex gap-0.5 animate-pulse" aria-label="Rated 5 out of 5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
                  ))}
                </div>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                  <img
                    src={img(te.seed, 96, 96)}
                    alt=""
                    aria-hidden="true"
                    className="h-10 w-10 rounded-full bg-slate-200 object-cover border border-slate-300 dark:border-slate-700"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{te.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-none font-medium">{te.role}</p>
                  </div>
                </figcaption>
              </div>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SiteFaq() {
  const [open, setOpen] = useState<number | null>(0);
  const { t } = useLanguage();

  const faqsList = FAQS.map((f, i) => ({
    q: t(`faq.q.${i}`) || f.q,
    a: t(`faq.a.${i}`) || f.a
  }));

  return (
    <section className="bg-slate-50 py-24 dark:bg-slate-900">
      <div className="mx-auto max-w-3xl px-5">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">
            {t('faq.tag')}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white leading-tight">
            {t('faq.title')}
          </h2>
        </div>

        <dl className="mt-12 space-y-3.5">
          {faqsList.map((f, i) => (
            <div
              key={f.q}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 shadow-sm"
            >
              <dt>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-900"
                  aria-expanded={open === i}
                >
                  <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-snug">{f.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                      open === i ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </dt>
              {open === i && (
                <dd className="px-6 pb-5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
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
