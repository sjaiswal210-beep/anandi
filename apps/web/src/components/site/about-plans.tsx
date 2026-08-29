'use client';

import { motion } from 'framer-motion';
import { Check, Maximize2, Home, TrendingUp, ArrowRight } from 'lucide-react';
import { CONFIGURATIONS, WHY, PROJECT, img } from './site-data';
import { useLanguage } from './language-context';

const whyIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Check, trending: TrendingUp, map: Maximize2, landmark: Home,
};

const reveal = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function SiteAbout() {
  const { t } = useLanguage();

  const points = [
    t('about.f1'),
    t('about.f2'),
    t('about.f3'),
    t('about.f4'),
    t('about.f5'),
  ];

  const whyPoints = WHY.map((w, i) => ({
    ...w,
    title: t(`why.title.${i}`),
    body: t(`why.body.${i}`),
  }));

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
            {t('about.tag')}
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white leading-[1.2]">
            {t('about.title')}
          </h2>
          <p className="mt-5 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('about.p1')}
          </p>
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('about.p2')}
          </p>
          <ul className="mt-8 space-y-3.5">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                  <Check className="h-3 w-3 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{point}</span>
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
          {whyPoints.map((w, i) => {
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
                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white leading-snug">{w.title}</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{w.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function SitePlans() {
  const { t } = useLanguage();

  const configs = CONFIGURATIONS.map((c, i) => ({
    ...c,
    type: t(`config.type.${i}`),
    price: t(`config.price.${i}`),
    ideal: t(`config.ideal.${i}`),
  }));

  return (
    <section id="plans" className="bg-slate-50 py-24 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">
            {t('nav.plans')}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {t('config.title')}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            {t('config.sub')}
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {configs.map((c, i) => (
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
                  {c.available} {t('config.avail')}
                </span>
              </div>

              <div className="p-5">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">{c.type}</h3>
                <p className="mt-1 text-base font-semibold text-amber-600 dark:text-amber-400">{c.price}</p>
                <div className="h-px bg-slate-100 dark:bg-slate-850 my-3" />

                <div className="space-y-2.5">
                  <p className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Maximize2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    <strong>{t('config.carpet')}</strong> {c.carpet}
                  </p>
                  <p className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Home className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    <strong>{t('config.ideal')}</strong> {c.ideal}
                  </p>
                </div>

                <a
                  href="#contact"
                  className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {t('config.btn')}
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
