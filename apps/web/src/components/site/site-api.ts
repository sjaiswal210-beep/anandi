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

export async function submitLead(payload: LeadPayload): Promise<void> {
  await axios.post(
    `${resolveApiUrl()}/website/public/${PROJECT.subdomain}/inquiry`,
    payload,
    { timeout: 15000 },
  );
}
