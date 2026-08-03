/**
 * Generate a URL-safe slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Format currency in Indian Rupee format
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format large numbers in Indian notation (Lakhs, Crores)
 */
export function formatIndianNumber(num: number): string {
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `${(num / 100000).toFixed(2)} L`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)} K`;
  }
  return num.toString();
}

/**
 * Generate a booking number
 */
export function generateBookingNumber(): string {
  const prefix = 'BK';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Calculate lead score based on various factors
 */
export function calculateLeadScore(factors: {
  hasEmail: boolean;
  hasPhone: boolean;
  hasBudget: boolean;
  hasTimeline: boolean;
  hasPreferredLocation: boolean;
  responseTime: number; // in hours
  engagementCount: number;
  visitCount: number;
  source: string;
}): number {
  let score = 0;

  if (factors.hasEmail) score += 5;
  if (factors.hasPhone) score += 10;
  if (factors.hasBudget) score += 15;
  if (factors.hasTimeline) score += 10;
  if (factors.hasPreferredLocation) score += 10;

  // Source quality
  const sourceScores: Record<string, number> = {
    REFERRAL: 20,
    WALK_IN: 18,
    WEBSITE: 15,
    GOOGLE_ADS: 12,
    FACEBOOK: 10,
    INSTAGRAM: 8,
    WHATSAPP: 8,
    COLD_CALL: 5,
    OTHER: 3,
  };
  score += sourceScores[factors.source] || 3;

  // Response time (within 24 hours is good)
  if (factors.responseTime <= 1) score += 10;
  else if (factors.responseTime <= 6) score += 7;
  else if (factors.responseTime <= 24) score += 3;

  // Engagement
  score += Math.min(factors.engagementCount * 2, 10);

  // Visits
  score += Math.min(factors.visitCount * 5, 15);

  return Math.min(score, 100);
}

/**
 * Parse phone number and format for Indian numbers
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  return phone;
}

/**
 * Generate a random API key
 */
export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const prefix = 'ros_';
  let key = '';
  for (let i = 0; i < 48; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${key}`;
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const output = { ...target };
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceVal = source[key];
      const targetVal = target[key];
      if (
        sourceVal &&
        typeof sourceVal === 'object' &&
        !Array.isArray(sourceVal) &&
        targetVal &&
        typeof targetVal === 'object' &&
        !Array.isArray(targetVal)
      ) {
        (output as Record<string, unknown>)[key] = deepMerge(
          targetVal as Record<string, unknown>,
          sourceVal as Record<string, unknown>,
        );
      } else {
        (output as Record<string, unknown>)[key] = sourceVal;
      }
    }
  }
  return output;
}

/**
 * Delay utility for rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delayMs = baseDelay * Math.pow(2, attempt);
        await delay(delayMs);
      }
    }
  }
  throw lastError;
}
