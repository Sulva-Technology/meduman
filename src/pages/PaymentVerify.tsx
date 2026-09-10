import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Clock } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { apiClient } from '../lib/api';
import type { VerifyPaymentResponse } from '../lib/types';

/**
 * Where Paystack sends the buyer's browser after checkout (a GET redirect with
 * `?trxref=&reference=` appended).
 *
 * Nothing about that redirect proves the charge settled — the query string is
 * attacker-controllable, and the buyer can land here having paid, cancelled, or
 * forged the URL. The only trusted signal is `POST /payments/:reference/verify`,
 * which makes the server re-check the charge with Paystack. So this page never
 * renders a failure: a SUCCESS response means protected, anything else (PENDING,
 * FAILED, 401, network drop) means "we're still confirming".
 */
type VerifyState = 'confirming' | 'success' | 'pending';

export default function PaymentVerify() {
  const navigate = useNavigate();
  // The path segment — the reference the backend itself generated and put in the
  // callback URL. Read from useParams, never from the query string.
  const { reference } = useParams<{ reference: string }>();
  const [state, setState] = useState<VerifyState>('confirming');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // No path segment means there is nothing the server can verify. That is not
    // a failure — the charge may still be settling — so stay on "confirming".
    if (!reference) {
      setState('pending');
      return;
    }

    let cancelled = false;
    setState('confirming');

    (async () => {
      try {
        // Authenticated route (no @Public() on the backend), so apiClient
        // attaches the bearer token. skipAuthRedirect matters: the default
        // hard-redirect to /login would bounce a buyer who just paid into a
        // login screen that looks like "payment failed". This way a 401 is
        // catchable and lands in the still-confirming state below.
        const result = await apiClient<VerifyPaymentResponse>(
          `/payments/${encodeURIComponent(reference)}/verify`,
          { method: 'POST', skipAuthRedirect: true }
        );
        if (cancelled) return;
        setState(result?.status === 'SUCCESS' ? 'success' : 'pending');
      } catch (err) {
        // 401, network failure, 5xx — none of these mean the payment failed, and
        // the client is in no position to decide that. Keep confirming.
        console.error('Payment verification failed:', err);
        if (!cancelled) setState('pending');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reference, attempt]);

  const confirming = state === 'confirming';

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[100px] animate-pulse-soft pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-success/5 rounded-full blur-[80px] animate-float-slow pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full relative z-10"
      >
        <GlassCard role="status" aria-live="polite" className="p-10 text-center">
          {confirming && (
            <>
              <div className="mx-auto w-16 h-16 bg-brand-050 rounded-full flex items-center justify-center mb-6">
                <div className="w-7 h-7 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
              </div>
              <h1 className="font-display text-2xl font-bold text-ink mb-2">Confirming your payment…</h1>
              <p className="text-muted">Please keep this page open. This only takes a moment.</p>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8 text-success" />
              </div>
              <h1 className="font-display text-2xl font-bold text-ink mb-2">Payment protected</h1>
              <p className="text-muted mb-8">
                Your money is held safely. Meduman releases it to the seller only once you confirm
                delivery.
              </p>
              {/* The verify response carries no transaction id, so link to the
                  ledger rather than guessing which transaction this was. */}
              <Button className="w-full" onClick={() => navigate('/app/transactions')}>
                View your transactions
              </Button>
            </>
          )}

          {state === 'pending' && (
            <>
              <div className="mx-auto w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-warning" />
              </div>
              <h1 className="font-display text-2xl font-bold text-ink mb-2">Still confirming your payment</h1>
              <p className="text-muted mb-8">
                We're still confirming it. This can take a few minutes.
              </p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setAttempt((n) => n + 1)}
                disabled={!reference}
              >
                Check again
              </Button>
            </>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
