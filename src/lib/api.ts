import { supabase } from './supabase';

// Defaults to the dev-server proxy at /api, which forwards to the NestJS API.
// In production set VITE_API_BASE_URL to the deployed API origin.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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
}

export async function apiClient<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const { publicRoute = false, ...init } = options;
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

  if (response.status === 401 && !publicRoute) {
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

