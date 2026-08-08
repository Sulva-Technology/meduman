import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a naira amount typed by a human into integer minor units (kobo).
 * Done on the decimal string, not with `parseFloat(x) * 100`, so 19.99 can
 * never land on 1998.9999999999998. Returns null when the input is not a
 * well-formed non-negative amount with at most 2 decimal places.
 *
 * The server recomputes every total regardless (money rule 1) — this only has
 * to be right enough to send an honest integer.
 */
export function nairaToKobo(input: string): number | null {
  const trimmed = input.trim().replace(/,/g, '');
  if (!/^\d*(\.\d{1,2})?$/.test(trimmed) || trimmed === '' || trimmed === '.') {
    return null;
  }
  const [whole, fraction = ''] = trimmed.split('.');
  const kobo = Number(whole || '0') * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(kobo) ? kobo : null;
}

/**
 * Percent (e.g. "7.5") to basis points (750). Mirrors the backend's
 * `taxRatePctBp` unit. Returns null for anything outside 0–100.
 */
export function percentToBasisPoints(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === '') return null;
  const pct = Number(trimmed);
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) return null;
  return Math.round(pct * 100);
}

/**
 * Client-side preview of the server's invoice math (`invoice.compute.ts`).
 * Integer kobo throughout; tax rounds half-up on the single division, exactly
 * as the backend does. Display only — the server's numbers are authoritative.
 */
export function previewInvoiceTotals(
  lines: { quantity: number; unitPrice: number }[],
  taxRatePctBp: number | null,
): { subtotal: number; taxAmount: number; total: number } {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const taxAmount = taxRatePctBp == null ? 0 : Math.round((subtotal * taxRatePctBp) / 10_000);
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}

/** Short human-readable reference derived from a server-owned uuid. */
export function shortRef(id: string, prefix = 'TX'): string {
  return `${prefix}-${id.slice(0, 8).toUpperCase()}`;
}

/** "3 days" / "4 hours" / "just now" — age of an ISO timestamp. */
export function relativeAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}
