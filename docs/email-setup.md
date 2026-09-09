# Meduman Email Setup Guide

This project includes a backend Express API (`server.ts`) that sends confirmation emails to users who register on the Meduman waitlist. 

The backend supports two main methods of sending email, as well as a development fallback.

## 1. Environment Variables

To configure email delivery, copy `.env.example` to `.env.local` (for local development) or set the environment variables in your hosting provider (e.g., Vercel, Heroku, etc.).

### Option A: Resend API (Recommended)
[Resend](https://resend.com) is a modern email service with a robust free tier.

```bash
RESEND_API_KEY=re_123456789...
SMTP_FROM="Meduman <no-reply@yourdomain.com>"
```

### Option B: SMTP Fallback (Nodemailer)
If you prefer to use a standard SMTP server (such as Gmail, SendGrid SMTP, Mailgun, Amazon SES, or custom hosting):

```bash
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM="Meduman <no-reply@yourdomain.com>"
```

### Option C: Development Mock Mode (No credentials required)
If neither `RESEND_API_KEY` nor `SMTP_HOST` is defined, the backend will operate in **Mock Mode**.
- It will print a detailed representation of the welcome email to the terminal (Node process console).
- The client app receives a successful `200 OK` response.
- This is highly recommended for offline development or testing UI flows without spending credits.

---

## 2. Running Locally

To start the API server locally:
```bash
# Starts the backend Express server on port 3000 (see .env.example, PORT=3000)
npm run server
```

To run the Vite client:
```bash
# Starts Vite on port 3001 (proxies /api to port 3000)
npm run dev
```

You can run both concurrently in separate terminal windows, or configure a task runner to launch them together.

---

## 3. Production Deployment

> **Where this endpoint lives.** `/api/send-waitlist-email` is served by THIS
> Express app (`server.ts`) on the **same origin as the frontend bundle** — it is
> NOT a NestJS route and must NOT be routed through `VITE_API_BASE_URL` (which
> points at the NestJS backend). That is why the frontend calls it as a relative
> path. In production the Express server must be reachable at the frontend's own
> origin: either run `server.ts` (it serves the built `dist/` + this endpoint on
> one port), or host this route on a serverless function at the same path. On a
> pure-static Vercel deploy with no such function, this endpoint 404s and the
> waitlist email silently falls back to console-warning (the waitlist row still
> saves to Supabase).

When compiling for production:
1. Run `npm run build` to build the React frontend.
2. Run `NODE_ENV=production npm run server` (or equivalent on Windows) to start Express. Express will serve the precompiled React build from the `dist/` directory and host the `/api/send-waitlist-email` endpoint on a single port.
