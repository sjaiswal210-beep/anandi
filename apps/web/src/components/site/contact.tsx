'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, Phone, Mail, MapPin } from 'lucide-react';
import { PROJECT, CONFIGURATIONS } from './site-data';
import { normalisePhone, submitLead } from './site-api';
import { useLanguage } from './language-context';

export function SiteContact() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '', config: CONFIGURATIONS[0].type });
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const local = normalisePhone(form.phone);
    if (!form.name.trim() || !local) {
      setError(t('contact.error.validation'));
      return;
    }
    setError('');
    setStatus('sending');
    try {
      await submitLead({
        name: form.name.trim(),
        phone: local,
        email: form.email || undefined,
        config: form.config,
        message: `Interested in ${form.config}. ${form.message}`.trim(),
        source: 'project_website',
      });
      setStatus('done');
    } catch {
      setStatus('error');
      setError(t('contact.error.api'));
    }
  };

  return (
    <section id="contact" className="bg-slate-950 py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2">
        {/* Copy */}
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-amber-400">
            {t('contact.tag')}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl leading-tight">
            {t('contact.title')}
          </h2>
          <p className="mt-4 max-w-md text-sm sm:text-base text-slate-400 leading-relaxed">
            {t('contact.sub')}
          </p>

          <ul className="mt-10 space-y-6">
            <li className="flex items-start gap-4">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Call</p>
                <a href={`tel:${PROJECT.phone.replace(/\s/g, '')}`} className="text-white hover:text-amber-400 font-semibold text-sm sm:text-base">
                  {PROJECT.phone}
                </a>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Email</p>
                <a href={`mailto:${PROJECT.email}`} className="text-white hover:text-amber-400 font-semibold text-sm sm:text-base">
                  {PROJECT.email}
                </a>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{t('contact.center')}</p>
                <p className="text-white font-semibold text-sm sm:text-base">{t('hero.location')}</p>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">{t('contact.hours')}</p>
              </div>
            </li>
          </ul>
        </div>
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm"
        >
          {status === 'done' ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <CheckCircle2 className="h-14 w-14 text-emerald-400" aria-hidden="true" />
              <h3 className="mt-5 text-xl font-bold text-white">{t('contact.thankyou')}</h3>
              <p className="mt-3 max-w-xs text-sm text-slate-300 font-semibold leading-relaxed">
                {t('contact.success')}
              </p>
              <button
                onClick={() => {
                  setForm({ name: '', phone: '', email: '', message: '', config: CONFIGURATIONS[0].type });
                  setStatus('idle');
                }}
                className="mt-7 rounded-full border border-white/20 px-6 py-2.5 text-xs sm:text-sm text-white font-semibold hover:bg-white/10"
              >
                {t('contact.submit.another')}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="cf-name" className="mb-1.5 block text-xs sm:text-sm text-slate-300 font-semibold">
                  {t('contact.name')} <span className="text-amber-400">*</span>
                </label>
                <input
                  id="cf-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs sm:text-sm text-white font-semibold placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                  placeholder={t('contact.name.placeholder')}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="cf-phone" className="mb-1.5 block text-xs sm:text-sm text-slate-300 font-semibold">
                    {t('contact.phone')} <span className="text-amber-400">*</span>
                  </label>
                  <input
                    id="cf-phone"
                    type="tel"
                    required
                    inputMode="numeric"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs sm:text-sm text-white font-semibold placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    placeholder={t('contact.phone.placeholder')}
                  />
                </div>
                <div>
                  <label htmlFor="cf-email" className="mb-1.5 block text-xs sm:text-sm text-slate-300 font-semibold">
                    {t('contact.email')}
                  </label>
                  <input
                    id="cf-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs sm:text-sm text-white font-semibold placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    placeholder={t('contact.email.placeholder')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cf-config" className="mb-1.5 block text-xs sm:text-sm text-slate-300 font-semibold">
                  {t('contact.config')}
                </label>
                <select
                  id="cf-config"
                  value={form.config}
                  onChange={(e) => setForm({ ...form, config: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs sm:text-sm text-white font-semibold focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                >
                  {CONFIGURATIONS.map((c) => (
                    <option key={c.type} value={c.type} className="bg-slate-900 text-white font-semibold">
                      {c.type} — {c.carpet} — {c.price}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="cf-message" className="mb-1.5 block text-xs sm:text-sm text-slate-300 font-semibold">
                  {t('contact.message')}
                </label>
                <textarea
                  id="cf-message"
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs sm:text-sm text-white font-semibold placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                  placeholder={t('contact.message.placeholder')}
                />
              </div>

              {error && (
                <p role="alert" className="text-xs sm:text-sm font-semibold text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-xs sm:text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
              >
                {status === 'sending' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {status === 'sending' ? t('contact.submitting') : t('contact.submit')}
              </button>

              <p className="text-center text-[10px] sm:text-xs text-slate-500 font-medium leading-relaxed">
                {t('contact.disclaimer')}
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
