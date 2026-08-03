'use client';

import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, Phone, Mail, MapPin } from 'lucide-react';
import { PROJECT, CONFIGURATIONS } from './site-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function SiteContact() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '', config: '3 BHK' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.phone.trim().length < 10) {
      setError('Please enter your name and a valid 10-digit phone number.');
      return;
    }
    setError('');
    setStatus('sending');
    try {
      await axios.post(`${API_URL}/website/public/${PROJECT.subdomain}/inquiry`, {
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        message: `Interested in ${form.config}. ${form.message}`.trim(),
        source: 'project_website',
      });
      setStatus('done');
    } catch {
      setStatus('error');
      setError('Could not submit right now. Please call us instead.');
    }
  };

  return (
    <section id="contact" className="bg-slate-950 py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2">
        {/* Copy */}
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-amber-400">Enquire</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Book a site visit
          </h2>
          <p className="mt-4 max-w-md text-slate-400">
            Share your details and our team will call you back within the hour.
            Complimentary pickup and drop within Pune city limits.
          </p>

          <ul className="mt-10 space-y-5">
            <li className="flex items-start gap-4">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Call</p>
                <a href={`tel:${PROJECT.phone.replace(/\s/g, '')}`} className="text-white hover:text-amber-400">
                  {PROJECT.phone}
                </a>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Email</p>
                <a href={`mailto:${PROJECT.email}`} className="text-white hover:text-amber-400">
                  {PROJECT.email}
                </a>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Experience centre</p>
                <p className="text-white">{PROJECT.location}</p>
                <p className="text-sm text-slate-500">Open all days, 10 AM to 7 PM</p>
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
              <h3 className="mt-5 text-xl font-semibold text-white">Thank you</h3>
              <p className="mt-2 max-w-xs text-sm text-slate-400">
                Your enquiry is registered. Our team will reach out shortly on{' '}
                {form.phone}.
              </p>
              <button
                onClick={() => {
                  setForm({ name: '', phone: '', email: '', message: '', config: '3 BHK' });
                  setStatus('idle');
                }}
                className="mt-7 rounded-full border border-white/20 px-6 py-2.5 text-sm text-white hover:bg-white/10"
              >
                Submit another enquiry
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="cf-name" className="mb-1.5 block text-sm text-slate-300">
                  Full name <span className="text-amber-400">*</span>
                </label>
                <input
                  id="cf-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                  placeholder="Your name"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="cf-phone" className="mb-1.5 block text-sm text-slate-300">
                    Phone <span className="text-amber-400">*</span>
                  </label>
                  <input
                    id="cf-phone"
                    type="tel"
                    required
                    inputMode="numeric"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    placeholder="98765 43210"
                  />
                </div>
                <div>
                  <label htmlFor="cf-email" className="mb-1.5 block text-sm text-slate-300">
                    Email
                  </label>
                  <input
                    id="cf-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    placeholder="you@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cf-config" className="mb-1.5 block text-sm text-slate-300">
                  Configuration of interest
                </label>
                <select
                  id="cf-config"
                  value={form.config}
                  onChange={(e) => setForm({ ...form, config: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                >
                  {CONFIGURATIONS.map((c) => (
                    <option key={c.type} value={c.type}>
                      {c.type} — {c.carpet} — {c.price}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="cf-message" className="mb-1.5 block text-sm text-slate-300">
                  Message
                </label>
                <textarea
                  id="cf-message"
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                  placeholder="Preferred visit date, budget, or any question"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 font-medium text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
              >
                {status === 'sending' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {status === 'sending' ? 'Submitting...' : 'Request a Call Back'}
              </button>

              <p className="text-center text-xs text-slate-500">
                By submitting you agree to be contacted about this project.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
