import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, AlertCircle, ArrowRight, AlertOctagon, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { MoneyText } from '../components/ui/MoneyText';
import { StatusPill } from '../components/ui/StatusPill';
import { apiClient } from '../lib/api';
import type { Paginated, PayoutView, PayoutWithTransaction, Transaction, TransactionStatus } from '../lib/types';
import { shortRef } from '../lib/utils';

/**
 * A payout row only exists once a release has been authorized, which happens
 * from RELEASE_PROCESSING. RELEASED transactions keep theirs; a failed transfer
 * leaves the transaction parked in RELEASE_PROCESSING with a FAILED payout.
 */
const PAYOUT_BEARING_STATUSES: TransactionStatus[] = ['RELEASE_PROCESSING', 'RELEASED'];

const TX_PAGE_SIZE = 50; // ListTransactionsDto caps `limit` at 50.

/** Kobo sums — plain integer addition, never float math. */
function sumKobo(rows: PayoutWithTransaction[], statuses: PayoutView['status'][]): number {
  return rows.reduce((acc, r) => (statuses.includes(r.status) ? acc + r.amount : acc), 0);
}

export default function Payouts() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<PayoutWithTransaction[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [scanned, setScanned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * The backend has no seller-wide payout list, so the ledger is assembled from
   * the seller's transactions plus a per-transaction payout read. Only
   * payout-bearing transactions are fetched, so this is bounded by how many of
   * the page have actually reached release.
   */
  async function loadPage(from: string | null): Promise<void> {
    const query = `/transactions?role=seller&limit=${TX_PAGE_SIZE}${from ? `&cursor=${from}` : ''}`;
    const page = await apiClient<Paginated<Transaction>>(query);

    const candidates = page.items.filter(tx => PAYOUT_BEARING_STATUSES.includes(tx.status));
    const results = await Promise.allSettled(
      candidates.map(tx => apiClient<PayoutView[]>(`/transactions/${tx.id}/payouts`)),
    );

    const fetched: PayoutWithTransaction[] = [];
    results.forEach((res, i) => {
      if (res.status !== 'fulfilled') {
        console.error('Failed to load payouts for a transaction:', res.reason);
        return;
      }
      const tx = candidates[i];
      res.value.forEach(p => fetched.push({ ...p, transaction: tx }));
    });
    fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setRows(prev => (from ? [...prev, ...fetched] : fetched));
    setScanned(prev => (from ? prev + page.items.length : page.items.length));
    setCursor(page.nextCursor);
  }

  async function loadFirst() {
    setLoading(true);
    setError(null);
    try {
      await loadPage(null);
    } catch (err) {
      console.error('Failed to load payouts:', err);
      setError(err instanceof Error ? err.message : 'Could not load your payouts.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      await loadPage(cursor);
    } catch (err) {
      console.error('Failed to load more payouts:', err);
    } finally {
      setLoadingMore(false);
    }
  }

  const totalReleased = sumKobo(rows, ['SUCCESS']);
  const pendingRelease = sumKobo(rows, ['PENDING', 'PROCESSING']);
  const needsAttention = rows.filter(r => r.status === 'FAILED' || r.status === 'REVERSED').length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-ink">Payouts Ledger</h1>
          <p className="text-muted mt-1">Track released funds and settlements to your bank.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted mb-4">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm font-medium">Total Paid Out</span>
          </div>
          <MoneyText amountInKobo={totalReleased} className="text-3xl font-display font-bold text-ink" />
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted mb-4">
            <Wallet className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium">In Flight</span>
          </div>
          <MoneyText amountInKobo={pendingRelease} className="text-3xl font-display font-bold text-ink" />
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted mb-4">
            <AlertCircle className="w-4 h-4 text-danger" />
            <span className="text-sm font-medium">Failed / Needs Attention</span>
          </div>
          <span className="text-3xl font-display font-bold text-ink tabular-nums">{needsAttention}</span>
        </GlassCard>
      </div>

      {!loading && !error && (
        <div className="flex items-start gap-2 text-xs text-muted px-1">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            Totals cover the {scanned} most recent transaction{scanned === 1 ? '' : 's'} loaded here
            {cursor ? ' — load more to include older ones.' : '.'}
          </span>
        </div>
      )}

      <GlassCard className="p-2 sm:p-4">
        {loading ? (
          <div className="space-y-3 px-2">
            {[1, 2].map(i => <div key={i} className="h-20 bg-line/30 rounded-xl animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="py-20 text-center flex flex-col items-center">
            <AlertOctagon className="w-12 h-12 text-danger mb-4" />
            <h3 className="text-lg font-semibold text-ink">Couldn't load payouts</h3>
            <p className="text-muted mt-1 mb-5">{error}</p>
            <Button onClick={loadFirst}>Try again</Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <Wallet className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-ink">No payouts yet</h3>
            <p className="text-muted mt-1">When transactions complete, funds released to you appear here.</p>
            {cursor && (
              <Button variant="secondary" className="mt-6" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Scanning…' : 'Scan older transactions'}
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line text-sm font-medium text-muted">
                  <th className="p-4 font-normal">Transaction</th>
                  <th className="p-4 font-normal">Amount</th>
                  <th className="p-4 font-normal">Status</th>
                  <th className="p-4 font-normal text-right">Created</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(po => (
                  <tr
                    key={po.id}
                    className="border-b border-line/50 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => navigate(`/app/transactions/${po.transaction.id}`)}
                  >
                    <td className="p-4">
                      <p className="font-semibold text-ink">{po.transaction.title}</p>
                      <p className="text-xs text-muted mt-0.5">{shortRef(po.transaction.id)}</p>
                    </td>
                    <td className="p-4">
                      <MoneyText amountInKobo={po.amount} className="font-medium text-ink" />
                      {po.attemptCount > 1 && (
                        <p className="text-xs text-muted mt-0.5">{po.attemptCount} attempts</p>
                      )}
                    </td>
                    <td className="p-4"><StatusPill status={po.status} /></td>
                    <td className="p-4 text-right text-sm text-muted">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <span className="inline-flex p-2 rounded-full text-muted group-hover:text-brand group-hover:bg-brand-050 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {cursor && (
              <div className="p-4 text-center">
                <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? 'Scanning…' : 'Scan older transactions'}
                </Button>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
