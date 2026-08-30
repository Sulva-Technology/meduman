import React, { useContext, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, FileText, ArrowRight, AlertOctagon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { MoneyText } from '../components/ui/MoneyText';
import { apiClient } from '../lib/api';
import { UserContext } from '../components/AppShell';
import type { Paginated, Transaction, TransactionStatus } from '../lib/types';
import { cn } from '../lib/utils';

const FILTERS: Record<string, TransactionStatus[] | null> = {
  ALL: null,
  ACTIVE: [
    'LINK_ACTIVE',
    'PAYMENT_PENDING',
    'PAYMENT_PROTECTED',
    'DELIVERY_IN_PROGRESS',
    'CONFIRMATION_PENDING'
  ],
  COMPLETED: ['RELEASE_PROCESSING', 'RELEASED'],
  ISSUES: ['DISPUTED', 'REFUND_PROCESSING', 'REFUNDED']
};

export default function Transactions() {
  const { user } = useContext(UserContext);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const role = user?.isSeller ? 'seller' : 'buyer';

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient<Paginated<Transaction>>(`/transactions?role=${role}&limit=20`);
        if (cancelled) return;
        setTransactions(res.items);
        setNextCursor(res.nextCursor);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load transactions:', err);
        setError(err instanceof Error ? err.message : 'Could not load transactions.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, [role]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await apiClient<Paginated<Transaction>>(
        `/transactions?role=${role}&limit=20&cursor=${nextCursor}`
      );
      setTransactions(prev => [...prev, ...res.items]);
      setNextCursor(res.nextCursor);
    } catch (err) {
      console.error('Failed to load more transactions:', err);
    } finally {
      setLoadingMore(false);
    }
  }

  // Filtering and search are client-side over the loaded pages. The API also
  // accepts a single `status`, but these tabs span several statuses each.
  const allowed = FILTERS[filter];
  const filteredTransactions = transactions.filter(t => {
    if (allowed && !allowed.includes(t.status)) return false;
    if (query.trim() && !t.title.toLowerCase().includes(query.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-ink">Transactions</h1>
        <Button onClick={() => navigate('/app/transactions/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          New Transaction
        </Button>
      </div>

      <GlassCard className="p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {['ALL', 'ACTIVE', 'COMPLETED', 'ISSUES'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  filter === f ? "bg-brand text-white" : "bg-transparent text-muted hover:bg-black/5 dark:hover:bg-white/5"
                )}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by item title..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-line bg-surface/50 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 px-2">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-line/30 rounded-xl animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="py-20 text-center flex flex-col items-center">
            <AlertOctagon className="w-12 h-12 text-danger mb-4" />
            <h3 className="text-lg font-semibold text-ink">Couldn't load transactions</h3>
            <p className="text-muted mt-1 mb-5">{error}</p>
            <Button onClick={() => window.location.reload()}>Try again</Button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <FileText className="w-12 h-12 text-muted mb-4" />
            <h3 className="text-lg font-semibold text-ink">No transactions found</h3>
            <p className="text-muted mt-1">Create your first protected link to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line text-sm font-medium text-muted">
                  <th className="p-4 font-normal">Item</th>
                  <th className="p-4 font-normal">Status</th>
                  <th className="p-4 font-normal text-right">Amount</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(tx => (
                  <tr
                    key={tx.id}
                    className="border-b border-line/50 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => navigate(`/app/transactions/${tx.id}`)}
                  >
                    <td className="p-4">
                      <p className="font-semibold text-ink">{tx.title}</p>
                      {tx.description && (
                        <p className="text-xs text-muted mt-0.5 line-clamp-1">{tx.description}</p>
                      )}
                    </td>
                    <td className="p-4"><StatusPill status={tx.status} /></td>
                    <td className="p-4 text-right">
                      <MoneyText amountInKobo={tx.amount} className="font-medium text-ink" />
                      <p className="text-xs text-muted mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/app/transactions/${tx.id}`}
                        onClick={e => e.stopPropagation()}
                        className="inline-flex p-2 rounded-full text-muted hover:text-brand hover:bg-brand-050 transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {nextCursor && (
              <div className="p-4 text-center">
                <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
