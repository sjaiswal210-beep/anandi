'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, CheckCircle2, X, Phone } from 'lucide-react';
import { PROJECT } from './site-data';
import { normalisePhone, submitLead } from './site-api';

// Shown once per browser session. A visitor who actually submits is never asked
// again (localStorage); a visitor who dismisses is left alone for the rest of
// the session but will see it on their next visit.
const SUBMITTED_KEY = 'anandi-lead-captured';
const DISMISSED_KEY = 'anandi-lead-dismissed';
const OPEN_DELAY_MS = 2500;

type Status = 'idle' | 'sending' | 'done' | 'error';

export function LeadPopup() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const nameRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<Element | null>(null);

  useEffect(() => {
    if (localStorage.getItem(SUBMITTED_KEY) === 'yes') return;
    if (sessionStorage.getItem(DISMISSED_KEY) === 'yes') return;

    const timer = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const close = useCallback(
    (remember: boolean) => {
      setOpen(false);
      if (remember) sessionStorage.setItem(DISMISSED_KEY, 'yes');
      // Return focus to wherever the user was before the dialog stole it.
      if (lastFocused.current instanceof HTMLElement) lastFocused.current.focus();
    },
    [],
  );

  // Focus management, Escape to close, and a simple focus trap while open.
  useEffect(() => {
    if (!open) return;

    lastFocused.current = document.activeElement;
    nameRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close(true);
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

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
        source: 'popup',
        message: 'Requested details via website popup.',
      });
      localStorage.setItem(SUBMITTED_KEY, 'yes');
      setStatus('done');
      setTimeout(() => setOpen(false), 4000);
    } catch {
      setStatus('error');
      setError('Could not send right now. Please call or WhatsApp us instead.');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            onClick={() => close(true)}
            aria-hidden="true"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-popup-title"
            aria-describedby="lead-popup-desc"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={() => close(true)}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            {status === 'done' ? (
              <div className="px-7 py-12 text-center">
                <CheckCircle2
                  className="mx-auto h-14 w-14 text-emerald-500"
                  aria-hidden="true"
                />
                <h2
                  id="lead-popup-title"
                  className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white"
                >
                  Thank you, {name.trim().split(/\s+/)[0]}!
                </h2>
                <p
                  id="lead-popup-desc"
                  className="mt-3 text-slate-600 dark:text-slate-400"
                >
                  We have sent the plot details and pricing to your WhatsApp. Our
                  team will call you shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-7 py-6 text-white">
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-100">
                    Anandi Park &middot; Wagholi, Pune
                  </p>
                  <h2 id="lead-popup-title" className="mt-2 text-2xl font-bold leading-snug">
                    Get plot prices on WhatsApp
                  </h2>
                  <p id="lead-popup-desc" className="mt-2 text-sm text-emerald-50">
                    84 residential plots from {PROJECT.priceFrom}. Clear titles,
                    gated layout. Share your number and we will send the full price
                    list right away.
                  </p>
                </div>

                <form onSubmit={submit} className="space-y-4 px-7 py-6" noValidate>
                  <div>
                    <label
                      htmlFor="lead-popup-name"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Your name
                    </label>
                    <input
                      id="lead-popup-name"
                      ref={nameRef}
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError('');
                      }}
                      autoComplete="name"
                      required
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder="e.g. Rajesh Patil"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lead-popup-phone"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Mobile number
                    </label>
                    <div className="mt-1.5 flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-950">
                      <span className="pl-4 pr-1 text-slate-500 dark:text-slate-400">
                        +91
                      </span>
                      <input
                        id="lead-popup-phone"
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
                        className="w-full rounded-r-lg bg-transparent px-2 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
                        placeholder="98765 43210"
                      />
                    </div>
                  </div>

                  {error && (
                    <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {status === 'sending' ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                        Sending&hellip;
                      </>
                    ) : (
                      'Send me the price list'
                    )}
                  </button>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <a
                      href={`tel:${PROJECT.phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      Call instead
                    </a>
                    <button
                      type="button"
                      onClick={() => close(true)}
                      className="text-sm text-slate-500 hover:underline dark:text-slate-400"
                    >
                      Maybe later
                    </button>
                  </div>

                  <p className="pt-1 text-center text-xs text-slate-500 dark:text-slate-500">
                    We only use your number to share plot details. No spam.
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
