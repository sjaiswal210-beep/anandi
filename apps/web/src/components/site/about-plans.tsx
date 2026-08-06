'use client';

import { motion } from 'framer-motion';
import { Check, Maximize2, Home, TrendingUp, ArrowRight } from 'lucide-react';
import { CONFIGURATIONS, WHY, PROJECT, img } from './site-data';

const whyIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Check, trending: TrendingUp, map: Maximize2, landmark: Home,
};

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
            {PROJECT.name} is a gated, planned residential plotting project by {PROJECT.builder} at
            Bakori, Wagholi — one of Pune East&apos;s fastest growing corridors. 84 residential plots
            with clear titles, ready infrastructure and all approvals in place.
          </p>
          <ul className="mt-8 space-y-3.5">
            {[
              'Residential plots, ready for construction',
              'Clear, marketable titles — no legal disputes',
              'Ready infrastructure: roads, water, electricity, drainage',
              'Transparent, all-inclusive pricing',
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
            src={img('ap-about-land', 700, 900)}
            alt="Anandi Park plotted layout with internal roads"
            className="col-span-1 h-full rounded-2xl object-cover shadow-lg"
          />
          <div className="space-y-4">
            <img
              src={img('ap-about-green', 700, 500)}
              alt="Landscaped central garden"
              className="rounded-2xl object-cover shadow-lg"
            />
            <img
              src={img('ap-about-gate', 700, 500)}
              alt="Project entry gate"
              className="rounded-2xl object-cover shadow-lg"
            />
          </div>
        </motion.div>
      </div>

      {/* Why Anandi Park */}
      <div className="mx-auto mt-20 max-w-7xl px-5">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((w, i) => {
            const Icon = whyIcons[w.icon] ?? Check;
            return (
              <motion.div
                key={w.title}
                variants={reveal}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
                  <Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">{w.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{w.body}</p>
              </motion.div>
            );
          })}
        </div>
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
            Choose your plot size
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Plot areas as per the sanctioned layout. All prices are all-inclusive;
            request a plot-wise cost sheet for exact figures.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                  alt={`${c.type}`}
                  className="h-44 w-full bg-slate-100 object-cover"
                />
                {c.featured && (
                  <span className="absolute right-4 top-4 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-slate-950">
                    Most popular
                  </span>
                )}
                <span className="absolute left-4 top-4 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-medium text-white">
                  {c.available} left
                </span>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{c.type}</h3>
                <p className="mt-1 text-base font-medium text-amber-600 dark:text-amber-400">{c.price}</p>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Maximize2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    {c.carpet}
                  </p>
                  <p className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Home className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    {c.ideal}
                  </p>
                </div>

                <a
                  href="#contact"
                  className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  Get cost sheet
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
