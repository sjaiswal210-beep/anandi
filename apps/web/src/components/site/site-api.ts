// Shared public-site API helpers.
// Both the contact form and the entry popup submit leads, so the URL resolution
// and payload shape live in one place rather than being duplicated.

import axios from 'axios';
import { PROJECT } from './site-data';

export function resolveApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    // Behind the production domain the API sits on its own subdomain over HTTPS.
    // On a bare IP or localhost it is the same host on port 4000.
    if (hostname === 'anandipark.in' || hostname === 'www.anandipark.in') {
      return 'https://api.anandipark.in/api/v1';
    }
    return `${protocol}//${hostname}:4000/api/v1`;
  }
  return 'http://localhost:4000/api/v1';
}

export interface LeadPayload {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  config?: string;
  /** Distinguishes which surface captured the lead, e.g. 'popup'. */
  source?: string;
}

/** Normalises an Indian mobile number to 10 digits, or null if implausible. */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const local = digits.replace(/^(?:0|91)(?=\d{10}$)/, '');
  if (local.length !== 10) return null;
  // Indian mobile numbers start 6-9.
  if (!/^[6-9]/.test(local)) return null;
  return local;
}

const QUEUE_KEY = 'anandi-lead-queue';
const INQUIRY_PATH = () => `${resolveApiUrl()}/website/public/${PROJECT.subdomain}/inquiry`;

/** One raw POST attempt. Throws on any non-2xx / network error. */
async function postLead(payload: LeadPayload): Promise<void> {
  await axios.post(INQUIRY_PATH(), payload, { timeout: 15000 });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Reads the offline queue from localStorage (safe if unavailable). */
function readQueue(): LeadPayload[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as LeadPayload[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: LeadPayload[]): void {
  if (typeof window === 'undefined') return;
  try {
    if (items.length === 0) localStorage.removeItem(QUEUE_KEY);
    else localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-50)));
  } catch {
    /* storage unavailable — nothing more we can do */
  }
}

function enqueueLead(payload: LeadPayload): void {
  const q = readQueue();
  // De-dupe by phone so repeated retries don't pile up the same person.
  const next = [...q.filter((l) => l.phone !== payload.phone), { ...payload }];
  writeQueue(next);
}

/**
 * Submits a lead reliably. Tries a few times with backoff; if every attempt
 * fails (API down, timeout, network drop), the lead is saved to a localStorage
 * queue and retried on the next page load via flushQueuedLeads(). This ensures
 * a paid ad click that fills the form is never silently lost.
 *
 * Resolves when the lead is either delivered OR safely queued. Throws only if
 * it can neither send nor queue (e.g. storage blocked AND network down), so the
 * caller can still show an error and ask the visitor to call/WhatsApp.
 */
export async function submitLead(payload: LeadPayload): Promise<void> {
  const delays = [0, 800, 2500]; // 3 attempts
  let lastErr: unknown;
  for (let i = 0; i < delays.length; i++) {
    if (delays[i]) await sleep(delays[i]);
    try {
      await postLead(payload);
      return; // delivered
    } catch (e) {
      lastErr = e;
    }
  }

  // All attempts failed — queue it so it isn't lost, then flush opportunistically.
  const before = readQueue().length;
  enqueueLead(payload);
  const queued = readQueue().length > before || readQueue().some((l) => l.phone === payload.phone);

  // Kick a background flush (don't block the UI). If it lands, great; if not,
  // it stays queued for the next visit.
  void flushQueuedLeads();

  if (!queued) {
    // Could neither send nor persist — surface the error to the caller.
    throw lastErr instanceof Error ? lastErr : new Error('Lead submit failed');
  }
  // Queued successfully: resolve as success so the visitor sees confirmation
  // (the lead will be delivered on retry / next load).
}

/**
 * Resends any leads queued from earlier failed submits. Call once on site load.
 * Safe to call repeatedly; delivered leads are removed from the queue.
 */
export async function flushQueuedLeads(): Promise<void> {
  if (typeof window === 'undefined') return;
  const queue = readQueue();
  if (queue.length === 0) return;

  const remaining: LeadPayload[] = [];
  for (const lead of queue) {
    try {
      await postLead(lead);
    } catch {
      remaining.push(lead); // still failing — keep for next time
    }
  }
  writeQueue(remaining);
}
