'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PROJECT } from '@/components/site/site-data';
import { normalisePhone, submitLead } from '@/components/site/site-api';

/**
 * Dedicated, ultra-light ad landing page.
 *
 * Purpose: capture the lead FAST from a cold paid click, then redirect to the
 * full site. No navigation, no popup, no close button, minimal JS/images — just
 * the Free TVS Jupiter offer and a 2-field form above the fold. Point Meta /
 * WhatsApp ads at https://anandipark.in/offer.
 */
type Status = 'idle' | 'sending' | 'done';

export default function OfferLandingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    const local = normalisePhone(phone);
    if (!local) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setStatus('sending');
    try {
      await submitLead({
        name: name.trim(),
        phone: local,
        source: 'ad-landing',
        message: 'Free TVS Jupiter offer — ad landing page.',
      });
    } catch {
      // submitLead already queues on failure; never block the visitor.
    }
    setStatus('done');
    // Redirect to the full site so they get the detailed info while we have
    // their lead captured. Small delay so they see the confirmation.
    setTimeout(() => router.push('/project'), 1400);
  };

  return (
    <main className="min-h-[100svh] bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 text-white flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/richland-transparent.png"
            alt="Rich-Land Developers"
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
            fetchPriority="high"
          />
          <span className="text-lg font-bold tracking-tight">Anandi Park</span>
        </div>

        {/* Offer */}
        <div className="rounded-2xl border border-amber-400/30 bg-white/5 backdrop-blur-sm p-6 shadow-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-slate-900">
            🛵 Limited seats only
          </p>
          <h1 className="mt-4 text-2xl font-extrabold leading-tight sm:text-3xl">
            Get a FREE TVS Jupiter
            <span className="block text-lg font-semibold text-emerald-300 sm:text-xl">
              with your plot at Anandi Park
            </span>
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            Open bungalow &amp; commercial plots at Bakori, Wagholi — Pune East.
            Ring Road just 500 m. Clear titles, gated layout, ready to build.
          </p>

          {status === 'done' ? (
            <div className="mt-6 rounded-xl bg-emerald-500/15 border border-emerald-400/30 p-5 text-center">
              <p className="text-lg font-bold text-emerald-300">You&apos;re in! 🎉</p>
              <p className="mt-1 text-sm text-slate-300">
                Our team will call you shortly with details and your Free TVS
                Jupiter offer. Taking you to the project&hellip;
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-3" noValidate>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                autoComplete="name"
                required
                placeholder="Your name"
                className="w-full rounded-xl border border-white/15 bg-white/95 px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <div className="flex items-center rounded-xl border border-white/15 bg-white/95 focus-within:ring-2 focus-within:ring-amber-400">
                <span className="pl-4 pr-1 font-medium text-slate-500">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError('');
                  }}
                  autoComplete="tel"
                  required
                  maxLength={13}
                  placeholder="Mobile number"
                  className="w-full rounded-r-xl bg-transparent px-2 py-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              {error && <p className="text-sm text-red-300">{error}</p>}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full rounded-xl bg-amber-500 px-5 py-4 text-base font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-70"
              >
                {status === 'sending' ? 'Sending…' : 'Claim my Free TVS Jupiter 🛵'}
              </button>

              <p className="text-center text-[11px] text-slate-400">
                No cost, no obligation. We&apos;ll only call about Anandi Park.
              </p>
            </form>
          )}
        </div>

        {/* Instant contact — zero-JS fallbacks so a lead is never lost */}
        <div className="mt-5 flex items-center justify-center gap-3">
          <a
            href={`https://wa.me/${PROJECT.whatsapp}?text=${encodeURIComponent(
              `Hi, I want the Free TVS Jupiter offer at ${PROJECT.name}. Please share plot details.`,
            )}`}
            className="flex-1 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20"
          >
            WhatsApp us
          </a>
          <a
            href={`tel:${PROJECT.phone.replace(/\s/g, '')}`}
            className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
          >
            Call now
          </a>
        </div>
      </div>
    </main>
  );
}
