/**
 * Public base URL for shareable links (pay pages, invoices, seller badges).
 * Defaults to the canonical domain; override per environment with VITE_APP_URL
 * (e.g. http://localhost:3001 to test real links locally, or a preview domain).
 */
const rawAppUrl = import.meta.env.VITE_APP_URL || 'https://meduman.sulvatech.com';
export const APP_URL = rawAppUrl.replace(/\/+$/, '');
