# Supabase Waitlist Setup

This app writes waitlist submissions to `public.waitlist_entries` when Supabase env vars are configured.

## Environment Variables

Set these in Vercel Project Settings and in local `.env.local` when testing locally:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

## Database Migration

Run the SQL migration in:

```text
supabase/migrations/20260525143000_create_waitlist_entries.sql
```

The migration enables Row Level Security. Public visitors can insert waitlist submissions, but there is intentionally no public `select` policy, so browser clients cannot read the waitlist table.

## Current Admin Page

The in-app admin waitlist screen remains a local/demo view. For production list management, use Supabase Studio or add authenticated admin access with a server-side API that uses a service role key. Do not expose the service role key in Vite client code.
