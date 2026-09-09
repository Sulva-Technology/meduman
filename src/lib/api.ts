import { supabase } from './supabase';

// Single source of truth for the API origin. Every backend call must resolve
// through here (apiClient, or a raw fetch importing API_BASE_URL) — nothing may
// hardcode a base URL of its own.
//
// Dev: blank VITE_API_BASE_URL → the Vite dev proxy at `/api`, which strips the
// prefix and forwards to the NestJS backend (see vite.config.ts). The dev proxy
// does NOT exist in production, so a misconfigured VITE_API_BASE_URL turns
// every request into a silent 404 — fail fast at boot instead.
const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (import.meta.env.PROD) {
  const trimmed = (envApiBaseUrl ?? '').trim();
  if (!trimmed) {
    throw new Error(
      '[Meduman] VITE_API_BASE_URL is missing in production. Set it to the bare ' +
      'backend origin (no /api suffix, no trailing slash), e.g. https://meduman-api.onrender.com'
    );
  }
  if (/\/api\/?$/.test(trimmed)) {
    throw new Error(
      `[Meduman] VITE_API_BASE_URL must NOT end in "/api" — the NestJS backend ` +
      `mounts every route at the root, so a /api suffix 404s all requests. Got: ${trimmed}`
    );
  }
  if (/\/$/.test(trimmed)) {
    throw new Error(
      `[Meduman] VITE_API_BASE_URL must have no trailing slash. Got: ${trimmed}`
    );
  }
}

export const API_BASE_URL = envApiBaseUrl || '/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export interface ApiRequestOptions extends RequestInit {
  /**
   * Mark a route the backend serves with `@Public()` (the pay page, the public
   * invoice view). No bearer token is attached and a 401 does NOT bounce the
   * visitor to /login — an unauthenticated buyer following a link is the normal
   * case for these routes, not a session problem.
   */
  publicRoute?: boolean;
  /**
   * Caller handles 401 itself (throws ApiError instead of hard-redirecting to
   * /login). Use in AppShell's /users/me load so a rejected session surfaces as
   * a visible error card rather than a silent bounce that looks like login failed.
   */
  skipAuthRedirect?: boolean;
}

export async function apiClient<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const { publicRoute = false, skipAuthRedirect = false, ...init } = options;
  const headers = new Headers(init.headers || {});

  if (supabase && !publicRoute) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }
  }

  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && !publicRoute && !skipAuthRedirect) {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: response.statusText };
    }
    
    // Check for TransitionRejectedError or others
    throw new ApiError(response.status, errorData.message || 'API request failed', errorData);
  }

  // 204 No Content (e.g. notification read receipts) has no JSON body.
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

