import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Copy, AlertOctagon, ArrowLeft, ExternalLink, RefreshCw, Smartphone, CheckCircle2, Wallet } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { MoneyText } from '../components/ui/MoneyText';
import { apiClient } from '../lib/api';
import type { Transaction, TimelineEvent, Dispute, PayoutView } from '../lib/types';
import { UserContext } from '../components/AppShell';
import { cn } from '../lib/utils';
import { RaiseDisputeModal } from '../components/ui/RaiseDisputeModal';

/** Short human-friendly reference derived from the (server-owned) id. */
const shortRef = (id: string) => `TX-${id.slice(0, 8).toUpperCase()}`;

function OTPModal({ isOpen, onClose, onConfirm, onRequestCode, loading }: { isOpen: boolean, onClose: () => void, onConfirm: (code: string) => void, onRequestCode: () => Promise<void>, loading: boolean }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const handleRequest = async () => {
    setRequestLoading(true);
    setRequestError(null);
    try {
      // Issues a code server-side; the plaintext is delivered out-of-band
      // (SMS / WhatsApp / bot) and never returned in the response.
      await onRequestCode();
      setStep('verify');
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Could not send a code. Try again.');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.slice(0, 6).split('');
      const newCode = [...code];
      pasted.forEach((char, i) => { if (index + i < 6) newCode[index + i] = char; });
      setCode(newCode);
      const nextEmpty = newCode.findIndex(c => !c);
      if (nextEmpty !== -1) {
        document.getElementById(`otp-${nextEmpty}`)?.focus();
      } else {
        document.getElementById(`otp-5`)?.focus();
      }
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = () => {
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      onConfirm(fullCode);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md">
        <GlassCard className="p-8">
          {step === 'request' ? (
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-brand-050 rounded-full flex items-center justify-center mb-6">
                <Smartphone className="w-8 h-8 text-brand" />
              </div>
              <h2 className="text-xl font-display font-bold text-ink mb-2">Confirm Delivery</h2>
              <p className="text-sm text-muted mb-6">We will send a secure confirmation code to your registered phone number or WhatsApp.</p>
              {requestError && (
                <div className="p-3 mb-4 bg-danger/10 text-danger text-sm rounded-lg text-left">{requestError}</div>
              )}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                <Button onClick={handleRequest} className="flex-1" disabled={requestLoading}>
                  {requestLoading ? 'Sending...' : 'Request Code'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-display font-bold text-ink mb-2">Enter Code</h2>
              <p className="text-sm text-muted mb-6">Enter the 6-digit code sent to your phone to release funds to the seller.</p>
              
              <div className="flex justify-center gap-2 mb-8">
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={e => handleChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-line bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                  />
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep('request')} disabled={loading}>Back</Button>
                <Button onClick={handleSubmit} className="flex-1" disabled={loading || code.join('').length < 6}>
                  {loading ? 'Verifying...' : 'Confirm & Release'}
                </Button>
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [payouts, setPayouts] = useState<PayoutView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'disputes' | 'payouts'>('overview');

  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchTx = async () => {
    if (!id) return;
    try {
      // The transaction read is authoritative; the sub-resources are best-effort
      // (a brand-new tx has no timeline/disputes/payouts yet).
      const [txRes, tlRes, dpRes, poRes] = await Promise.allSettled([
        apiClient<Transaction>(`/transactions/${id}`),
        apiClient<TimelineEvent[]>(`/transactions/${id}/timeline`),
        apiClient<Dispute[]>(`/transactions/${id}/disputes`),
        apiClient<PayoutView[]>(`/transactions/${id}/payouts`),
      ]);
      if (txRes.status === 'fulfilled') {
        setTransaction(txRes.value);
        setError(null);
      } else {
        throw txRes.reason;
      }
      if (tlRes.status === 'fulfilled') setTimeline(tlRes.value);
      if (dpRes.status === 'fulfilled') setDisputes(dpRes.value);
      if (poRes.status === 'fulfilled') setPayouts(poRes.value);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Could not load this transaction.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTx();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAction = async (actionEndpoint: string) => {
    if (!id) return;
    setActionLoading(true);
    setActionError(null);
    try {
      // Server owns the transition (state machine). Rejected transitions 409.
      await apiClient<Transaction>(`/transactions/${id}/${actionEndpoint}`, { method: 'POST' });
      await fetchTx(); // refetch authoritative state
    } catch (err) {
      console.error(err);
      setActionError(err instanceof Error ? err.message : 'That action could not be completed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Buyer requests an out-of-band delivery-confirmation code.
  const requestOtp = async () => {
    if (!id) return;
    await apiClient(`/transactions/${id}/otp`, { method: 'POST' });
  };

  const handleConfirmOtp = async (code: string) => {
    if (!id) return;
    setActionLoading(true);
    setActionError(null);
    try {
      // Verify the code + drive BUYER_CONFIRM + enqueue release, server-side.
      await apiClient<Transaction>(`/transactions/${id}/confirm-otp`, {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      setOtpModalOpen(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      await fetchTx();
    } catch (err) {
      console.error(err);
      setActionError(err instanceof Error ? err.message : 'That code was not accepted.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRaiseDispute = async (reason: string, _files: File[]) => {
    if (!id) return;
    setActionLoading(true);
    setActionError(null);
    try {
      // The modal collects a free-text explanation; the backend takes a reason
      // enum + description, so we file it as OTHER with the text as description.
      // NOTE: evidence file upload is a separate two-step seam (create evidence
      // row -> PUT to a signed Supabase URL) and is not wired here yet.
      await apiClient<Dispute>(`/transactions/${id}/disputes`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'OTHER', description: reason.slice(0, 2000) }),
      });
      setDisputeModalOpen(false);
      setActiveTab('disputes');
      await fetchTx(); // status -> DISPUTED, release frozen
    } catch (err) {
      console.error(err);
      setActionError(err instanceof Error ? err.message : 'Could not raise the dispute.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="h-48 bg-line/30 rounded-2xl animate-pulse" />
        <div className="h-96 bg-line/30 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <AlertOctagon className="w-12 h-12 text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-ink">{error ? 'Could not load transaction' : 'Not found'}</h3>
        {error && <p className="text-muted mt-1">{error}</p>}
        <Button variant="secondary" className="mt-6" onClick={() => navigate('/app/transactions')}>Back to list</Button>
      </div>
    );
  }

  const isSeller = user?.activeRole === 'seller';

  return (
    <div className="max-w-4xl mx-auto py-6">
      <OTPModal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        onConfirm={handleConfirmOtp}
        onRequestCode={requestOtp}
        loading={actionLoading}
      />
      <RaiseDisputeModal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        onSubmit={handleRaiseDispute}
        loading={actionLoading}
      />

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-success/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3"
          >
            <CheckCircle2 className="w-6 h-6" />
            <div>
              <p className="font-bold">Delivery Confirmed!</p>
              <p className="text-sm opacity-90">Funds are being released to the seller.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => navigate('/app/transactions')} className="flex items-center text-sm font-medium text-muted hover:text-ink transition-colors mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to list
      </button>

      {/* Header Card */}
      <GlassCard className="p-6 md:p-10 mb-8 relative overflow-hidden">
        {['PAYMENT_PROTECTED', 'DELIVERY_IN_PROGRESS', 'CONFIRMATION_PENDING'].includes(transaction.status) && (
          <div className="absolute top-0 right-0 bg-warning/20 text-warning text-xs font-bold px-6 py-1.5 rounded-bl-xl flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> FUNDS HELD SAFELY
          </div>
        )}
        {transaction.status === 'DISPUTED' && (
          <div className="absolute top-0 inset-x-0 bg-danger text-white text-sm font-semibold px-4 py-2 text-center flex justify-center items-center gap-2">
            <AlertOctagon className="w-4 h-4" /> Release is frozen while this dispute is open.
          </div>
        )}
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mt-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-ink">{transaction.title}</h1>
              <StatusPill status={transaction.status} />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted">
              <span className="flex items-center gap-1 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md">
                Ref: {shortRef(transaction.id)}
                <button className="hover:text-ink" onClick={() => navigator.clipboard.writeText(transaction.id)}><Copy className="w-3.5 h-3.5" /></button>
              </span>
              <span>Created {new Date(transaction.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm text-muted mb-1 font-medium">Protected Amount</p>
            <MoneyText amountInKobo={transaction.amount} className="text-4xl font-display font-bold text-brand" />
          </div>
        </div>

        {/* Action Zone */}
        <div className="mt-10 pt-8 border-t border-line/50 flex flex-col sm:flex-row items-center gap-4">
          {isSeller ? (
            <>
              {transaction.status === 'DRAFT' && <Button onClick={() => handleAction('publish')}>Publish Link</Button>}
              {transaction.status === 'PAYMENT_PROTECTED' && <Button onClick={() => handleAction('start-delivery')}>Start Delivery</Button>}
              {transaction.status === 'DELIVERY_IN_PROGRESS' && <Button onClick={() => handleAction('mark-delivered')}>Mark as Delivered</Button>}
            </>
          ) : (
            <>
              {transaction.status === 'CONFIRMATION_PENDING' && (
                <Button onClick={() => setOtpModalOpen(true)} className="bg-success hover:bg-success-600 text-white shadow-[0_4px_14px_0_rgba(14,158,110,0.39)]">
                  Confirm Delivery & Release
                </Button>
              )}
            </>
          )}

          {['PAYMENT_PROTECTED', 'DELIVERY_IN_PROGRESS', 'CONFIRMATION_PENDING'].includes(transaction.status) && (
            <Button variant="ghost" className="text-danger hover:bg-danger/10 hover:text-danger ml-auto" onClick={() => setDisputeModalOpen(true)}>
              Raise Dispute
            </Button>
          )}
          
          {isSeller && ['DRAFT', 'LINK_ACTIVE'].includes(transaction.status) && (
            <Button variant="ghost" className="text-muted hover:text-danger ml-auto" disabled={actionLoading} onClick={() => handleAction('cancel')}>
              Cancel Transaction
            </Button>
          )}
        </div>

        {actionError && (
          <div className="mt-4 p-3 bg-danger/10 text-danger text-sm rounded-lg">{actionError}</div>
        )}
      </GlassCard>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-line mb-6 overflow-x-auto hide-scrollbar">
        {['overview', 'timeline', 'disputes', 'payouts'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={cn(
              "pb-4 text-sm font-semibold capitalize whitespace-nowrap border-b-2 transition-colors",
              activeTab === tab ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <GlassCard className="p-6 md:p-8 min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Release Rule</h3>
                <div className="bg-surface/50 border border-line rounded-xl p-4 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-brand shrink-0" />
                  <div>
                    <p className="font-semibold text-ink">Buyer Confirmation</p>
                    <p className="text-sm text-muted mt-1">Funds will be released when the buyer confirms receipt via OTP.</p>
                  </div>
                </div>
              </div>
              {transaction.publicLinkId && isSeller && (
                <div>
                  <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Payment Link</h3>
                  <div className="flex items-center gap-2 p-1.5 pl-4 bg-surface border border-line rounded-xl">
                    <div className="flex-1 text-sm font-medium truncate text-ink">
                      meduman.com/pay/{transaction.publicLinkId}
                    </div>
                    <Button size="sm" variant="secondary" className="rounded-lg h-9">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="secondary" className="rounded-lg h-9" onClick={() => window.open(`/pay/${transaction.publicLinkId}`)}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          timeline.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-ink">No events yet</h3>
              <p className="text-muted mt-1">Activity on this transaction will appear here.</p>
            </div>
          ) : (
            <div className="relative before:absolute before:inset-y-2 before:left-3 before:w-px before:bg-line space-y-8 pl-4">
              {timeline.map((event, i) => (
                <div key={event.id} className="relative pl-8">
                  <div className={cn(
                    "absolute left-[-1.1rem] top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-canvas z-10",
                    i === timeline.length - 1 ? "border-brand" : "border-line"
                  )}>
                    <div className={cn("w-2 h-2 rounded-full", i === timeline.length - 1 ? "bg-brand" : "bg-muted")} />
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{event.description || event.type.replace(/[._]/g, ' ')}</p>
                    <p className="text-sm text-muted mt-0.5">{new Date(event.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'disputes' && (
          disputes.length === 0 ? (
            <div className="text-center py-12">
              <AlertOctagon className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-ink">No disputes</h3>
              <p className="text-muted mt-1">This transaction is running smoothly.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((d) => (
                <div key={d.id} className="border border-line rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="font-semibold text-ink capitalize">{d.reason.replace(/_/g, ' ').toLowerCase()}</span>
                    <StatusPill status={d.status} />
                  </div>
                  {d.description && <p className="text-sm text-muted">{d.description}</p>}
                  {d.resolution && <p className="text-sm text-ink mt-2"><span className="font-medium">Resolution:</span> {d.resolution}</p>}
                  <p className="text-xs text-muted mt-2">Opened {new Date(d.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'payouts' && (
          payouts.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-ink">No payouts yet</h3>
              <p className="text-muted mt-1">Payouts will appear here once funds are released.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map((p) => (
                <div key={p.id} className="border border-line rounded-xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <MoneyText amountInKobo={p.amount} className="text-lg font-display font-bold text-ink" />
                    <p className="text-xs text-muted mt-1">Attempts: {p.attemptCount} • {new Date(p.createdAt).toLocaleString()}</p>
                  </div>
                  <StatusPill status={p.status} />
                </div>
              ))}
            </div>
          )
        )}
      </GlassCard>
    </div>
  );
}
