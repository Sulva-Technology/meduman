import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, CheckCircle2, AlertOctagon, TrendingUp, ArrowRight, Wallet, ArrowUpRight } from 'lucide-react';
import { UserContext } from '../components/AppShell';
import { GlassCard } from '../components/ui/GlassCard';
import { apiClient } from '../lib/api';
import type { Paginated, Transaction } from '../lib/types';
import { StatusPill } from '../components/ui/StatusPill';
import { MoneyText } from '../components/ui/MoneyText';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function Dashboard() {
  const { user } = useContext(UserContext);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const isSeller = user?.isSeller ?? false;

  useEffect(() => {
    async function loadData() {
      try {
        const role = isSeller ? 'seller' : 'buyer';
        const res = await apiClient<Paginated<Transaction>>(
          `/transactions?role=${role}&limit=10`
        );
        setTransactions(res.items);
      } catch (err) {
        console.error('Failed to load transactions:', err);
        setError(err instanceof Error ? err.message : 'Could not load transactions.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isSeller]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-line/50 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-line/30 rounded-[20px] animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-8 text-center max-w-md mx-auto mt-8">
        <AlertOctagon className="w-8 h-8 text-danger mx-auto mb-3" />
        <p className="text-ink font-medium">Couldn't load your dashboard</p>
        <p className="text-sm text-muted mt-1 mb-5">{error}</p>
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </GlassCard>
    );
  }

  // Buyer waits on CONFIRMATION_PENDING; seller acts on PAYMENT_PROTECTED.
  const actionable = transactions.filter(t =>
    isSeller
      ? t.status === 'PAYMENT_PROTECTED'
      : t.status === 'CONFIRMATION_PENDING'
  );

  const PROTECTED_STATUSES: Transaction['status'][] = [
    'PAYMENT_PROTECTED',
    'DELIVERY_IN_PROGRESS',
    'CONFIRMATION_PENDING',
    'DISPUTED'
  ];
  const protectedTotal = transactions
    .filter(t => PROTECTED_STATUSES.includes(t.status))
    .reduce((sum, t) => sum + t.amount, 0);
  const awaitingDelivery = transactions.filter(t => t.status === 'DELIVERY_IN_PROGRESS').length;
  const awaitingConfirmation = transactions.filter(t => t.status === 'CONFIRMATION_PENDING').length;
  const completed = transactions.filter(t => t.status === 'RELEASED').length;
  const releasedTotal = transactions
    .filter(t => t.status === 'RELEASED')
    .reduce((sum, t) => sum + t.amount, 0);
  const openDisputes = transactions.filter(t => t.status === 'DISPUTED').length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-ink">Welcome back, {user?.name?.split(' ')[0] || 'there'}.</h1>
          <p className="text-muted mt-1">Here's what's happening with your protected transactions.</p>
        </div>
        <div className="flex gap-3">
          {isSeller ? (
            <>
              <Button onClick={() => navigate('/app/invoices/new')} variant="secondary">New Invoice</Button>
              <Button onClick={() => navigate('/app/transactions/new')}>New Protected Link</Button>
            </>
          ) : (
            <Button onClick={() => navigate('/app/transactions')}>View Transactions</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted mb-4">
            <Shield className="w-4 h-4 text-brand" />
            <span className="text-sm font-medium">{isSeller ? 'Protected Balance' : 'Protected Right Now'}</span>
          </div>
          <MoneyText amountInKobo={protectedTotal} className="text-3xl font-display font-bold text-ink" />
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted mb-4">
            <Clock className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium">Awaiting Delivery</span>
          </div>
          <span className="text-3xl font-display font-bold text-ink tabular-nums">{awaitingDelivery}</span>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted mb-4">
            <CheckCircle2 className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium">{isSeller ? 'Awaiting Confirmation' : 'Needs Your Confirmation'}</span>
          </div>
          <span className="text-3xl font-display font-bold text-ink tabular-nums">{awaitingConfirmation}</span>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted mb-4">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm font-medium">{isSeller ? 'Released' : 'Completed'}</span>
          </div>
          {isSeller ? (
            <MoneyText amountInKobo={releasedTotal} className="text-3xl font-display font-bold text-ink" />
          ) : (
            <span className="text-3xl font-display font-bold text-ink tabular-nums">{completed}</span>
          )}
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between hidden xl:flex">
          <div className="flex items-center gap-2 text-muted mb-4">
            <AlertOctagon className="w-4 h-4 text-danger" />
            <span className="text-sm font-medium">Open Disputes</span>
          </div>
          <span className="text-3xl font-display font-bold text-ink tabular-nums">{openDisputes}</span>
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-display font-bold text-ink flex items-center gap-2">
            Needs your attention
            {actionable.length > 0 && <span className="bg-warning/20 text-warning text-xs px-2 py-0.5 rounded-full font-bold">{actionable.length}</span>}
          </h2>
          
          {actionable.length === 0 ? (
            <GlassCard className="p-8 text-center border-dashed">
              <CheckCircle2 className="w-8 h-8 text-muted mx-auto mb-3" />
              <p className="text-ink font-medium">You're all caught up!</p>
              <p className="text-muted text-sm mt-1">No action required on any active transactions.</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {actionable.map(tx => (
                <Link key={tx.id} to={`/app/transactions/${tx.id}`}>
                  <GlassCard className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-brand/30 transition-colors group">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-ink">{tx.title}</span>
                        <StatusPill status={tx.status} />
                      </div>
                      <p className="text-sm text-muted">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <MoneyText amountInKobo={tx.amount} className="font-medium text-ink" />
                      <div className="w-8 h-8 rounded-full bg-brand-050 flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-white transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-display font-bold text-ink mb-6">Recent activity</h2>
          <GlassCard className="p-6">
            {transactions.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">No transactions yet.</p>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-2.5 before:w-px before:bg-line">
                {transactions.slice(0, 5).map(tx => (
                  <Link key={tx.id} to={`/app/transactions/${tx.id}`} className="relative pl-8 block">
                    <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-surface border border-line flex items-center justify-center z-10">
                      <div className="w-2 h-2 rounded-full bg-brand" />
                    </div>
                    <p className="text-sm text-ink"><span className="font-medium">{tx.title}</span></p>
                    <p className="text-xs text-muted mt-0.5">
                      {tx.status.replace(/_/g, ' ').toLowerCase()} · {new Date(tx.updatedAt).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
}
