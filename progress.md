# Meduman — Project Understanding

_Snapshot: 2026-08-06. What I learned from reading the repo._

## What it is

**Meduman** — transaction protection (escrow) platform for social commerce in Africa. Buyers/sellers on WhatsApp, Instagram, Telegram, Facebook Marketplace transact safely: payment held until delivery confirmed.

Owner: Sulva Technology. Domain: `meduman.sulvatech.com`. Originally scaffolded from Google AI Studio (`README.md` still has the AI Studio boilerplate, app id `22b0789c-30f5-4f19-9ee5-f9c0bfae7965`).

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 19, TypeScript 5.8, Vite 6 |
| Routing | react-router-dom 7 (`BrowserRouter`) |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite` |
| Animation | framer-motion / motion 12 |
| Icons | lucide-react |
| Auth + DB | Supabase (`@supabase/supabase-js` 2) |
| Backend | Express 4 in `server.ts`, run with `tsx` |
| Email | Resend, fallback nodemailer SMTP, fallback console mock |
| AI | `@google/genai` declared in deps + `GEMINI_API_KEY` in env — **not used anywhere in `src/` yet** |
| Package manager | Bun (`bun.lock` present, `package-lock.json` deleted) |

## Architecture

- **Single Vite dev server on port 3000.** `vite.config.ts` mounts the Express app as middleware via a custom `expressApiPlugin()` — anything under `/api` goes to `server.ts`, everything else to Vite. So one process serves both in dev.
- **Production:** `npm start` → `tsx server.ts`. Express serves `dist/` statically with an SPA catch-all fallback.
- **Auth:** Supabase client-side (`signInWithPassword`, `signUp`, `signOut`, `getSession`). Session persisted + auto-refreshed.
- **API layer:** `src/lib/api.ts` — `apiClient<T>()` wrapper around `fetch`, base `/api`. Pulls the Supabase session and attaches `Authorization: Bearer <access_token>`. Redirects to `/login` on 401. Throws a private `ApiError` carrying status + data.
- **Layout:** `src/components/AppShell.tsx` wraps every authenticated route — guards the session, loads `/api/users/me`, handles sign-out.

## Routes (`src/App.tsx`)

**Public:** `/` (Home), `/pay/:publicLinkId`, `/invoice/:publicViewId`, `/login`, `/signup`, `*` (NotFound)

**App (in AppShell):** `/app` (Dashboard), `/app/transactions`, `/app/transactions/new`, `/app/transactions/:id`, `/app/disputes`, `/app/settings`, `/app/settings/payout`, `/app/notifications`, `/app/payouts`, `/app/invoices`, `/app/invoices/new`

**Admin (in AppShell):** `/admin`, `/admin/transactions/:id`, `/admin/disputes`

## Product surface (inferred from pages)

Escrow transaction lifecycle with a state machine (`TransactionDetail.tsx` has a timeline and action endpoints), payment links (`/pay/:publicLinkId`), invoicing with public share links (`/invoice/:publicViewId`), seller payouts + bank recipient setup, disputes with buyer-raise and admin-resolve modals, notifications, and an admin console.

UI kit in `src/components/ui/`: `Button`, `GlassCard`, `MoneyText`, `StatusPill`, `RaiseDisputeModal`, `AdminResolveModal`. Plus a branded `MedumanPreloader`. Glassmorphism, navy palette (`#081635`, `#232F72`).

## Backend reality check

`server.ts` implements **exactly one endpoint**: `POST /api/send-waitlist-email`. It renders a styled HTML welcome email and sends via Resend → SMTP → console mock, in that order of availability.

Every other API the frontend expects does not exist yet:

- `GET /api/users/me` — called live in `AppShell.tsx:56` and `Signup.tsx:48`
- `GET /api/transactions` and `?limit=10` — called live in `Transactions.tsx:20`, `Dashboard.tsx:21`
- `GET /api/transactions/:id`, `POST /api/transactions`, `POST /api/transactions/:id/:action` — **commented out** in `TransactionDetail.tsx:138,173`, `NewTransaction.tsx:44`
- `GET /api/disputes` — commented out, `Disputes.tsx:17`
- `POST /api/users/me/seller/recipient` — commented out, `PayoutSettings.tsx:31`

So the app is a **complete frontend against a mostly-unbuilt backend**. Pages initialize state to `[]` and either call an endpoint that 404s or have the call commented out.

## Database

One migration only: `supabase/migrations/20260525143000_create_waitlist_entries.sql` → `public.waitlist_entries`.

Well-built for what it is: `citext` unique email, `pgcrypto` for uuid, generated `public_id` (`WM-XXXXXX`), CHECK constraints on `user_type` / `main_channel` / email shape / consent-must-be-true. RLS enabled, all privileges revoked from `anon`/`authenticated`, then column-scoped `INSERT` granted back. Public can insert, nobody can read.

**No tables exist for transactions, invoices, disputes, payouts, or user profiles.** That's the main gap.

## Environment (`.env.example`)

```
GEMINI_API_KEY=      RESEND_API_KEY=      SMTP_FROM=
SMTP_HOST=           SMTP_PASS=           SMTP_PORT=
SMTP_USER=           VITE_SITE_URL=
VITE_SUPABASE_ANON_KEY=                   VITE_SUPABASE_URL=
```

Local file is `.env.local`. Only `VITE_`-prefixed vars reach the browser. `isSupabaseConfigured` degrades gracefully — `supabase` is `null` and waitlist writes return `{ storedRemotely: false }` when unset.

## Scripts

```
dev      vite --port=3000 --host=0.0.0.0    # frontend + API together
start    tsx server.ts                       # production
build    vite build
lint     tsc --noEmit                        # typecheck only, no ESLint
preview  vite preview
clean    rm -rf dist server.js
```

## Repo state

Branch `main`. Recent commits are mostly unlabelled (`main`, `done`) — no conventional-commit history to read intent from.

Large uncommitted body of work — the entire authenticated app appears to be new and untracked:

- Untracked: `src/Home.tsx`, `src/components/AppShell.tsx`, `src/components/ui/`, `src/lib/api.ts`, `src/lib/utils.ts`, `src/pages/` (19 pages), `bun.lock`
- Modified: `.env.example`, `package.json`, `server.ts`, `src/App.tsx`, `src/index.css`, `src/lib/supabase.ts`, `vite.config.ts`
- Deleted: `package-lock.json` (migrated to Bun)

`src/Home.tsx` is 3168 lines — the entire marketing landing page in one file. ~7000 lines of TSX total.

## Docs present

`docs/email-setup.md`, `docs/supabase-waitlist.md`, `README.md` (still AI Studio boilerplate, only documents the waitlist).

## Open questions / observations

1. **No payment processor integrated.** Escrow is the core product but there's no Paystack/Flutterwave/Stripe dependency. The email footer claims "CBN-regulated depository partners" — that integration doesn't exist in code.
2. **`@google/genai` + `GEMINI_API_KEY` are dead weight** so far. `metadata.json` declares `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`. Intent unclear — dispute adjudication? fraud scoring?
3. **CORS is `Access-Control-Allow-Origin: *`** on the Express app (`server.ts:21`). Fine while the only endpoint is an unauthenticated waitlist write; needs tightening before authenticated endpoints ship.
4. **`apiClient` attaches a bearer token but no server verifies it** yet — no Supabase JWT verification middleware exists.
5. **No tests, no CI, no ESLint.** `lint` is `tsc --noEmit`.
6. **No admin role check** visible — `/admin` routes use the same `AppShell` as user routes.
7. Types are loose in pages — `useState<any[]>([])` throughout.

## Likely next work

Build the backend: Supabase schema for users/transactions/invoices/disputes/payouts with RLS, JWT verification middleware in Express, then implement the endpoints the frontend already calls. Pick and integrate a payment processor. Add an admin role guard.
