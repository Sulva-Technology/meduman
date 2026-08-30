<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/22b0789c-30f5-4f19-9ee5-f9c0bfae7965

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set the Supabase waitlist variables if you want live waitlist writes
3. Run the app:
   `npm run dev`

## Vercel routing

`vercel.json` serves the Vite app for direct page visits such as `/login`,
`/signup`, and `/app/transactions`, allowing React Router to handle them.
Redeploy after changing this configuration. Existing static files remain served
normally, and `/api` requests are excluded from the page fallback.
Set `VITE_API_BASE_URL` to the deployed NestJS API origin in Vercel; the Vite
development proxy does not run in production.

## Supabase Waitlist

Run the migration in `supabase/migrations/20260525143000_create_waitlist_entries.sql`, then set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel. The table is protected with Row Level Security and allows public inserts only.
