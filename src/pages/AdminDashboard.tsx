import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, TrendingUp, AlertOctagon, Wallet, ArrowRight, UserCheck, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { MoneyText } from '../components/ui/MoneyText';
import { StatusPill } from '../components/ui/StatusPill';
import { apiClient } from '../lib/api';
import type { AdminDispute, Paginated, Transaction, TransactionStatus } from '../lib/types';
import { relativeAge, shortRef } from '../lib/utils';

/** Statuses where buyer funds are held by Meduman and not yet with the seller. */
const FUNDS_HELD_STATUSES: TransactionStatus[] = [
  'PAYMENT_PROTECTED',
  'DELIVERY_IN_PROGRESS',
  'CONFIRMATION_PENDING',
  'DISPUTED',
];

/** In-flight lifecycle — anything not yet terminal. */
const ACTIVE_STATUSES: TransactionStatus[] = [
  'LINK_ACTIVE',
  'PAYMENT_PENDING',
  ...FUNDS_HELD_STATUSES,
  'RELEASE_PROCESSING',
  'REFUND_PROCESSING',
];

/** AdminListTransactionsDto caps `limit` at 100. */
const TX_SCAN_LIMIT = 100;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [openDisputes, setOpenDisputes] = useState<AdminDispute[]>([]);
  const [frozen, setFrozen] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [txPage, disputePage] = await Promise.all([
        apiClient<Paginated<Transaction>>(`/admin/transactions?limit=${TX_SCAN_LIMIT}`),
        apiClient<Paginated<AdminDispute>>('/admin/disputes?status=OPEN&limit=25'),
      ]);
      setTransactions(txPage.items);
      setOpenDisputes(disputePage.items);
      setFrozen(txPage.items.filter(tx => tx.status === 'DISPUTED'));
    } catch (err) {
      console.error('Failed to load the admin console:', err);
      setError(err instanceof Error ? err.message : 'Could not load the admin console.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Integer kobo addition only.
  const heldVolume = transactions.reduce(
    (acc, tx) => (FUNDS_HELD_STATUSES.includes(tx.status) ? acc + tx.amount : acc),
    0,
  );
  const activeCount = transactions.filter(tx => ACTIVE_STATUSES.includes(tx.status)).length;
  const releasingCount = transactions.filter(tx => tx.status === 'RELEASE_PROCESSING').length;

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-10 w-64 bg-line/30 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-line/30 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-line/30 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center flex flex-col items-center">
        <AlertOctagon className="w-12 h-12 text-danger mb-4" />
        <h3 className="text-lg font-semibold text-ink">Couldn't load the admin console</h3>
        <p className="text-muted mt-1 mb-5">{error}</p>
        <Button onClick={load}>Try again</Button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-ink">Admin Console</h1>
        <p className="text-muted mt-1">System oversight and dispute resolution.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 text-muted mb-4">
            <ShieldAlert className="w-4 h-4 text-brand" />
            <span className="text-sm font-medium">Protected Volume Held</span>
          </div>
          <MoneyText amountInKobo={heldVolume} className="text-2xl font-display font-bold text-ink" />
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-2 text-muted mb-4">
            <TrendingUp className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium">Active Transactions</span>
          </div>
          <span className="text-2xl font-display font-bold text-ink tabular-nums">{activeCount}</span>
        </GlassCard>

        <GlassCard
          className="p-5 cursor-pointer hover:border-danger/30 transition-colors"
          onClick={() => navigate('/admin/disputes')}
        >
          <div className="flex items-center gap-2 text-muted mb-4">
            <AlertOctagon className="w-4 h-4 text-danger" />
            <span className="text-sm font-medium">Open Disputes</span>
          </div>
          <span className="text-2xl font-display font-bold text-danger tabular-nums">{openDisputes.length}</span>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-2 text-muted mb-4">
            <Wallet className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium">Releasing</span>
          </div>
          <span className="text-2xl font-display font-bold text-ink tabular-nums">{releasingCount}</span>
        </GlassCard>
      </div>

      <div className="flex items-start gap-2 text-xs text-muted px-1">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          Counts and volume are over the {transactions.length} most recent transactions
          (the API returns at most {TX_SCAN_LIMIT} per page) — not lifetime totals.
        </span>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold text-ink">Open disputes queue</h2>
          <GlassCard className="p-4 space-y-2">
            {openDisputes.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="w-8 h-8 text-muted mx-auto mb-3" />
                <p className="text-ink font-medium">No open disputes</p>
              </div>
            ) : (
              openDisputes.slice(0, 6).map(d => (
                <div
                  key={d.id}
                  onClick={() => navigate(`/admin/transactions/${d.transactionId}`)}
                  className="p-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors flex items-center justify-between gap-4 group"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ink truncate">{d.transaction.title}</p>
                    <p className="text-sm text-muted mt-0.5 capitalize">
                      {d.reason.replace(/_/g, ' ').toLowerCase()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <MoneyText amountInKobo={d.transaction.amount} className="text-sm text-ink" />
                    <span className="text-xs font-bold text-danger bg-danger/10 px-2 py-1 rounded mt-1">
                      {relativeAge(d.createdAt)} old
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted mt-2 group-hover:text-ink transition-colors" />
                  </div>
                </div>
              ))
            )}
            {openDisputes.length > 6 && (
              <div className="pt-2 text-center">
                <Button variant="secondary" size="sm" onClick={() => navigate('/admin/disputes')}>
                  View all {openDisputes.length}
                </Button>
              </div>
            )}
          </GlassCard>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold text-ink">Frozen transactions</h2>
          <GlassCard className="p-4 space-y-2">
            {frozen.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="w-8 h-8 text-muted mx-auto mb-3" />
                <p className="text-ink font-medium">Queue is clear</p>
                <p className="text-sm text-muted mt-1">No transaction is currently frozen by a dispute.</p>
              </div>
            ) : (
              frozen.slice(0, 6).map(tx => (
                <div
                  key={tx.id}
                  onClick={() => navigate(`/admin/transactions/${tx.id}`)}
                  className="p-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors flex items-center justify-between gap-4 group"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ink truncate">{tx.title}</p>
                    <p className="text-xs text-muted mt-0.5">{shortRef(tx.id)}</p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <MoneyText amountInKobo={tx.amount} className="text-sm text-ink" />
                    <div className="mt-1"><StatusPill status={tx.status} /></div>
                  </div>
                </div>
              ))
            )}
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
}
