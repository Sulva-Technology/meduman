import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from './AppShell';

/**
 * Route-level ADMIN gate for everything under /admin.
 *
 * Renders inside AppShell, which has already resolved the session (and bounced
 * anonymous visitors to /login) and loaded the user. `isAdmin` comes from the
 * Supabase session's `app_metadata.role` — the same claim the backend's
 * RolesGuard reads, and one the user cannot edit. `GET /users/me` returns the
 * Prisma User row, which carries `roleFlags` but no admin role, so the JWT
 * claim is the only source for this.
 *
 * This is a UX gate, not a security boundary: every /admin/* endpoint is
 * independently @Roles('ADMIN') server-side. It exists so a non-admin is sent
 * away instead of being shown a console that 403s on every panel.
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useContext(UserContext);

  if (!user) {
    // AppShell renders its own loading/error state before children mount, so
    // this is only reachable transiently. Render nothing rather than flashing
    // a redirect at a user whose profile is still resolving.
    return null;
  }

  if (!user.isAdmin) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
