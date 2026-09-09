import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { MoneyText } from '../components/ui/MoneyText';
import { apiClient, API_BASE_URL } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { InitializePaymentResponse, PublicTransactionView } from '../lib/types';

/** Statuses the backend will serve publicly. Anything else means the link is closed. */
const PAYABLE_STATUSES = ['LINK_ACTIVE', 'PAYMENT_PENDING'];

export default function PayPage() {
  const { publicLinkId } = useParams<{ publicLinkId: string }>();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<PublicTransactionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'inactive' | 'error' | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransaction() {
      try {
        // Public endpoint — no bearer token needed, so apiClient's 401 redirect
        // would be wrong here. Use fetch directly against the shared base.
        const response = await fetch(`${API_BASE_URL}/public/transactions/${publicLinkId}`);
        if (response.status === 404) {
          setError('inactive');
          return;
        }
        if (!response.ok) {
          throw new Error('Failed to load transaction details.');
        }
        setTransaction((await response.json()) as PublicTransactionView);
      } catch (err) {
        console.error('Failed to load payment link:', err);
        setError('error');
      } finally {
        setLoading(false);
      }
    }

    if (publicLinkId) {
      fetchTransaction();
    }
  }, [publicLinkId]);

  const handlePay = async () => {
    if (!transaction) return;
    setInitError(null);

    // Payment initialization is authenticated — the backend needs a buyer
    // identity and email to open the charge. Send unauthenticated buyers to
    // login and bring them back to this exact link afterwards.
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    if (!session) {
      navigate(`/login?next=${encodeURIComponent(`/pay/${publicLinkId}`)}`);
      return;
    }

    setIsInitializing(true);
    try {
      const data = await apiClient<InitializePaymentResponse>('/payments/initialize', {
        method: 'POST',
        body: JSON.stringify({ publicLinkId })
      });
      if (!data.authorizationUrl) {
        throw new Error('No authorization URL returned.');
      }
      // Leaving the SPA for Paystack's hosted checkout.
      window.location.href = data.authorizationUrl;
    } catch (err) {
      console.error('Payment initialization failed:', err);
      setInitError(err instanceof Error ? err.message : 'Could not start payment. Please try again.');
      setIsInitializing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-line rounded-full mb-4"></div>
          <div className="h-6 w-48 bg-line rounded mb-2"></div>
          <div className="h-4 w-32 bg-line rounded"></div>
        </div>
      </div>
    );
  }

  if (error === 'inactive') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
          <GlassCard className="p-10 text-center">
            <div className="mx-auto w-16 h-16 bg-muted/10 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-muted" />
            </div>
            <h1 className="font-display text-2xl font-bold text-ink mb-2">Link Inactive</h1>
            <p className="text-muted mb-8">This payment link is no longer active or has already been paid.</p>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/')}>
              Return to Home
            </Button>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  if (error === 'error' || !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
          <GlassCard className="p-10 text-center">
            <div className="mx-auto w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-danger" />
            </div>
            <h1 className="font-display text-2xl font-bold text-ink mb-2">Something went wrong</h1>
            <p className="text-muted mb-8">We couldn't load the transaction details. Please refresh and try again.</p>
            <Button variant="secondary" className="w-full" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  if (!PAYABLE_STATUSES.includes(transaction.status)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
          <GlassCard className="p-10 text-center">
            <div className="mx-auto w-16 h-16 bg-muted/10 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-muted" />
            </div>
            <h1 className="font-display text-2xl font-bold text-ink mb-2">Link closed</h1>
            <p className="text-muted mb-8">This payment link is no longer accepting payments.</p>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/')}>
              Return to Home
            </Button>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  const sellerName = transaction.seller.displayName || 'this seller';
  // Buyer pays the protection fee only under BUYER_PAYS; otherwise the seller absorbs it.
  const buyerPaysFee = transaction.feeModel === 'BUYER_PAYS';
  const totalToPay = transaction.amount + (buyerPaysFee ? transaction.feeAmount : 0);

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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-sm mb-4">
            <Lock className="w-5 h-5 text-brand" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink mb-1">Protected Payment</h1>
          <p className="text-muted text-sm flex items-center justify-center gap-1">
            <span>By</span>
            <span className="font-medium text-ink">{sellerName}</span>
            {transaction.seller.verified && <Shield className="w-3.5 h-3.5 text-brand ml-0.5" />}
          </p>
          {transaction.seller.trustLevel && (
            <span className="inline-block mt-2 text-[11px] font-semibold uppercase tracking-wider text-brand bg-brand-050 px-2.5 py-1 rounded-full">
              {transaction.seller.trustLevel} seller
            </span>
          )}
        </div>

        <GlassCard className="p-6 md:p-8">
          <div className="mb-8">
            <h2 className="text-sm font-medium text-muted mb-1">Order Summary</h2>
            <p className="text-lg font-medium text-ink leading-snug">{transaction.title}</p>
            {transaction.description && (
              <p className="text-sm text-muted mt-1">{transaction.description}</p>
            )}
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted">Item Amount</span>
              <MoneyText amountInKobo={transaction.amount} className="text-ink" />
            </div>

            {buyerPaysFee && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Protection Fee</span>
                <MoneyText amountInKobo={transaction.feeAmount} className="text-ink" />
              </div>
            )}

            <div className="pt-4 border-t border-line flex justify-between items-center">
              <span className="font-medium text-ink">Total to Pay</span>
              <MoneyText amountInKobo={totalToPay} className="text-2xl font-display font-bold text-brand" />
            </div>
          </div>

          <div className="bg-brand-050 rounded-xl p-4 mb-8 flex items-start gap-3">
            <Shield className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <p className="text-sm text-brand-700 leading-relaxed">
              Your money is held safely until you confirm delivery — Meduman never releases it to the seller until then.
            </p>
          </div>

          {initError && (
            <div className="mb-4 p-3 bg-danger/10 text-danger text-sm rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{initError}</p>
            </div>
          )}

          <Button
            className="w-full h-14 text-lg shadow-[0_4px_14px_0_rgba(35,47,114,0.39)]"
            onClick={handlePay}
            disabled={isInitializing}
          >
            {isInitializing ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Securely Connecting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Pay Securely <Lock className="w-4 h-4" />
              </span>
            )}
          </Button>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
            <CheckCircle className="w-3.5 h-3.5 text-success" />
            <span>Bank-grade security. Partnered with CBN licensed banks.</span>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
