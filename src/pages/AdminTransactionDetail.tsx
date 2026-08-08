import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, History, ShieldAlert, AlertOctagon, Wallet, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { MoneyText } from '../components/ui/MoneyText';
import { StatusPill } from '../components/ui/StatusPill';
import { AdminResolveModal } from '../components/ui/AdminResolveModal';
import { apiClient } from '../lib/api';
import type {
  AuditLog,
  Dispute,
  DisputeResolveOutcome,
  PayoutView,
  TimelineEvent,
  Transaction,
} from '../lib/types';
import { shortRef } from '../lib/utils';

/** Dispute statuses that freeze automated release (money rule 5). */
const FREEZING_STATUSES = ['OPEN', 'UNDER_REVIEW'];

/** `transaction.status_change` audit rows carry `{ event, from, to }`. */
function describeTransition(entry: AuditLog): string {
  const meta = entry.metadata;
  if (meta && typeof meta.from === 'string' && typeof meta.to === 'string') {
    return `${meta.from} → ${meta.to}`;
  }
  return entry.action;
}

export default function AdminTransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [payouts, setPayouts] = useState<PayoutView[]>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [resolveOpen, setResolveOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string | null>(null);

  async function fetchAll() {
    if (!id) return;
    try {
      // The transaction read is authoritative (admins pass the participant check
      // via appRole); everything else is best-effort.
      const [txRes, tlRes, dpRes, poRes, auRes] = await Promise.allSettled([
        apiClient<Transaction>(`/transactions/${id}`),
        apiClient<TimelineEvent[]>(`/transactions/${id}/timeline`),
        apiClient<Dispute[]>(`/transactions/${id}/disputes`),
        apiClient<PayoutView[]>(`/transactions/${id}/payouts`),
        apiClient<AuditLog[]>(`/admin/transactions/${id}/audit`),
      ]);
      if (txRes.status !== 'fulfilled') throw txRes.reason;
      setTransaction(txRes.value);
      setError(null);
      if (tlRes.status === 'fulfilled') setTimeline(tlRes.value);
      if (dpRes.status === 'fulfilled') setDisputes(dpRes.value);
      if (poRes.status === 'fulfilled') setPayouts(poRes.value);
      if (auRes.status === 'fulfilled') setAudit(auRes.value);
    } catch (err) {
      console.error('Failed to load the transaction:', err);
      setError(err instanceof Error ? err.message : 'Could not load this transaction.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openDispute = disputes.find(d => FREEZING_STATUSES.includes(d.status)) ?? null;
  const failedPayout = payouts.find(p => p.status === 'FAILED' || p.status === 'REVERSED') ?? null;

  /** Admin resolution. The server drives the state machine and audits it. */
  const handleResolve = async (outcome: DisputeResolveOutcome, resolution: string) => {
    if (!openDispute) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await apiClient<Dispute>(`/disputes/${openDispute.id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ outcome, resolution }),
      });
      setResolveOpen(false);
      setActionNote(`Dispute resolved: ${outcome === 'RELEASE' ? 'released to seller' : 'refunded to buyer'}.`);
      await fetchAll();
    } catch (err) {
      console.error('Could not resolve the dispute:', err);
      setActionError(err instanceof Error ? err.message : 'Could not resolve this dispute.');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * The one admin route that moves money. It re-sends the payout already
   * authorized for this transaction — it can never create a second one.
   */
  const handleRetryPayout = async () => {
    if (!id) return;
    setActionLoading(true);
    setActionError(null);
    setActionNote(null);
    try {
      await apiClient<PayoutView>(`/admin/transactions/${id}/payout/retry`, { method: 'POST' });
      setActionNote('Payout retry submitted.');
      await fetchAll();
    } catch (err) {
      console.error('Could not retry the payout:', err);
      setActionError(err instanceof Error ? err.message : 'Could not retry this payout.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-48 bg-line/30 rounded-2xl animate-pulse" />
        <div className="h-72 bg-line/30 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center">
        <AlertOctagon className="w-12 h-12 text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-ink">{error ? 'Could not load transaction' : 'Not found'}</h3>
        {error && <p className="text-muted mt-1">{error}</p>}
        <Button variant="secondary" className="mt-6" onClick={() => navigate('/admin/disputes')}>Back to queue</Button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate('/admin/disputes')} className="flex items-center text-sm font-medium text-muted hover:text-ink transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </button>

      <GlassCard className="p-8 border-brand/20 bg-brand/5 dark:bg-canvas-ink">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-ink flex flex-wrap items-center gap-3">
              {transaction.title} <StatusPill status={transaction.status} />
            </h1>
            <p className="text-sm text-muted mt-2 font-mono">{shortRef(transaction.id)}</p>
            <div className="mt-3 text-sm text-muted space-y-0.5">
              <p>Seller: <span className="font-mono">{shortRef(transaction.sellerId, 'USR')}</span></p>
              <p>Buyer: <span className="font-mono">{transaction.buyerId ? shortRef(transaction.buyerId, 'USR') : '—'}</span></p>
              <p>Release rule: {transaction.releaseRule.replace(/_/g, ' ').toLowerCase()}</p>
            </div>
          </div>
          <div className="text-left md:text-right shrink-0">
            <p className="text-sm text-muted mb-1 font-medium">Protected Amount</p>
            <MoneyText amountInKobo={transaction.amount} className="text-3xl font-display font-bold text-brand" />
          </div>
        </div>

        {openDispute && (
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-danger/10 rounded-xl mb-4">
            <ShieldAlert className="w-6 h-6 text-danger shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-danger">Dispute Open: Release Frozen</p>
              <p className="text-sm text-danger/80 capitalize">
                {openDispute.reason.replace(/_/g, ' ').toLowerCase()}
                {openDispute.description ? ` — ${openDispute.description}` : ''}
              </p>
            </div>
            <div className="sm:ml-auto shrink-0">
              <Button variant="destructive" disabled={actionLoading} onClick={() => setResolveOpen(true)}>
                Resolve Dispute
              </Button>
            </div>
          </div>
        )}

        {failedPayout && (
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-warning/10 rounded-xl mb-4">
            <Wallet className="w-6 h-6 text-warning shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-warning">Payout {failedPayout.status.toLowerCase()}</p>
              <p className="text-sm text-warning/80">
                The transfer did not settle. A retry verifies the previous reference at the
                provider first and only re-sends if it truly failed.
              </p>
            </div>
            <div className="sm:ml-auto shrink-0">
              <Button variant="secondary" disabled={actionLoading || Boolean(openDispute)} onClick={handleRetryPayout}>
                <RefreshCw className="w-4 h-4 mr-2" /> Retry Payout
              </Button>
            </div>
          </div>
        )}

        {actionError && <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg">{actionError}</div>}
        {actionNote && <div className="p-3 bg-success/10 text-success text-sm rounded-lg">{actionNote}</div>}
      </GlassCard>

      <AdminResolveModal
        isOpen={resolveOpen}
        onClose={() => setResolveOpen(false)}
        onResolve={handleResolve}
        loading={actionLoading}
        error={actionError}
      />

      {/* Payouts */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-bold font-display text-ink mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5" /> Payouts
        </h2>
        {payouts.length === 0 ? (
          <p className="text-sm text-muted">No payout has been authorized for this transaction.</p>
        ) : (
          <div className="space-y-3">
            {payouts.map(p => (
              <div key={p.id} className="border border-line rounded-xl p-4 flex items-center justify-between gap-3">
                <div>
                  <MoneyText amountInKobo={p.amount} className="text-lg font-display font-bold text-ink" />
                  <p className="text-xs text-muted mt-1">
                    Attempts: {p.attemptCount} • {new Date(p.createdAt).toLocaleString()}
                  </p>
                </div>
                <StatusPill status={p.status} />
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Timeline */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-bold font-display text-ink mb-4 flex items-center gap-2">
          <History className="w-5 h-5" /> Timeline
        </h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-muted">No timeline events recorded.</p>
        ) : (
          <div className="space-y-3">
            {timeline.map(ev => (
              <div key={ev.id} className="flex items-baseline justify-between gap-4 text-sm border-b border-line/50 pb-2 last:border-0">
                <span className="text-ink font-medium">{ev.description || ev.type.replace(/[._]/g, ' ')}</span>
                <span className="text-xs text-muted shrink-0">{new Date(ev.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Audit log (money rule 6 — immutable, oldest first) */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-bold font-display text-ink mb-4 flex items-center gap-2">
          <History className="w-5 h-5" /> Audit Log
        </h2>
        {audit.length === 0 ? (
          <p className="text-sm text-muted">No audit rows for this transaction.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="p-3 font-medium">Timestamp</th>
                  <th className="p-3 font-medium">Actor</th>
                  <th className="p-3 font-medium">Transition</th>
                  <th className="p-3 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {audit.map(entry => (
                  <tr key={entry.id} className="border-b border-line/50 font-mono text-xs">
                    <td className="p-3 text-muted whitespace-nowrap">{new Date(entry.createdAt).toLocaleString()}</td>
                    <td className="p-3">
                      {entry.actorType}
                      {entry.actorId ? ` (${entry.actorId.slice(0, 8)})` : ''}
                    </td>
                    <td className="p-3">{describeTransition(entry)}</td>
                    <td className="p-3 text-muted">{entry.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
