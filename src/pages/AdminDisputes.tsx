import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertOctagon, ArrowRight, Search, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { MoneyText } from '../components/ui/MoneyText';
import { StatusPill } from '../components/ui/StatusPill';
import { apiClient } from '../lib/api';
import type { AdminDispute, DisputeStatus, Paginated } from '../lib/types';
import { cn, relativeAge, shortRef } from '../lib/utils';

/** Server-side filter — AdminListDisputesDto takes a single DisputeStatus. */
const STATUS_TABS: { key: string; status: DisputeStatus | null }[] = [
  { key: 'OPEN', status: 'OPEN' },
  { key: 'UNDER REVIEW', status: 'UNDER_REVIEW' },
  { key: 'ALL', status: null },
];

export default function AdminDisputes() {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [tab, setTab] = useState('OPEN');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeStatus = STATUS_TABS.find(t => t.key === tab)?.status ?? null;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const q = `/admin/disputes?limit=25${activeStatus ? `&status=${activeStatus}` : ''}`;
        const page = await apiClient<Paginated<AdminDispute>>(q);
        if (cancelled) return;
        setDisputes(page.items);
        setCursor(page.nextCursor);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load disputes:', err);
        setError(err instanceof Error ? err.message : 'Could not load the dispute queue.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [activeStatus]);

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const q = `/admin/disputes?limit=25&cursor=${cursor}${activeStatus ? `&status=${activeStatus}` : ''}`;
      const page = await apiClient<Paginated<AdminDispute>>(q);
      setDisputes(prev => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch (err) {
      console.error('Failed to load more disputes:', err);
    } finally {
      setLoadingMore(false);
    }
  }

  const filtered = disputes.filter(d => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      d.transaction.title.toLowerCase().includes(q) ||
      d.transactionId.toLowerCase().includes(q) ||
      d.reason.toLowerCase().includes(q)
    );
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-ink">Disputes Queue</h1>
          <p className="text-muted mt-1">Triage and resolve transaction disputes.</p>
        </div>
      </div>

      <GlassCard className="p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {STATUS_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors capitalize",
                  tab === t.key ? "bg-brand text-white" : "bg-transparent text-muted hover:bg-black/5 dark:hover:bg-white/5"
                )}
              >
                {t.key.toLowerCase()}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search title, ref or reason..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-line bg-surface/50 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 px-2">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-line/30 rounded-xl animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="py-20 text-center flex flex-col items-center">
            <AlertOctagon className="w-12 h-12 text-danger mb-4" />
            <h3 className="text-lg font-semibold text-ink">Couldn't load disputes</h3>
            <p className="text-muted mt-1 mb-5">{error}</p>
            <Button onClick={() => window.location.reload()}>Try again</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <FileText className="w-12 h-12 text-muted mb-4" />
            <h3 className="text-lg font-semibold text-ink">Nothing in this queue</h3>
            <p className="text-muted mt-1">No dispute matches the current filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line text-sm font-medium text-muted">
                  <th className="p-4 font-normal">Transaction</th>
                  <th className="p-4 font-normal">Opened by</th>
                  <th className="p-4 font-normal">Reason</th>
                  <th className="p-4 font-normal text-right">Amount</th>
                  <th className="p-4 font-normal text-right">Age</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const isFrozen = d.transaction.status === 'DISPUTED';
                  return (
                    <tr
                      key={d.id}
                      className="border-b border-line/50 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => navigate(`/admin/transactions/${d.transactionId}`)}
                    >
                      <td className="p-4">
                        <p className="font-semibold text-ink">{d.transaction.title}</p>
                        <p className="text-xs text-muted mt-0.5">{shortRef(d.transactionId)}</p>
                        {isFrozen && (
                          <p className="text-xs text-danger font-bold mt-1 bg-danger/10 px-2 py-0.5 rounded w-fit">FROZEN</p>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        <p className="text-muted font-mono text-xs">{shortRef(d.openedBy, 'USR')}</p>
                        <div className="mt-1"><StatusPill status={d.status} /></div>
                      </td>
                      <td className="p-4 text-sm text-ink capitalize">
                        {d.reason.replace(/_/g, ' ').toLowerCase()}
                        {d.desiredOutcome && (
                          <span className="text-xs text-muted block mt-1 capitalize">
                            wants {d.desiredOutcome.replace(/_/g, ' ').toLowerCase()}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <MoneyText amountInKobo={d.transaction.amount} className="font-medium text-ink" />
                      </td>
                      <td className="p-4 text-right text-sm font-bold text-danger">
                        {relativeAge(d.createdAt)}
                      </td>
                      <td className="p-4 text-right">
                        <span className="inline-flex p-2 rounded-full text-muted group-hover:text-brand group-hover:bg-brand-050 transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {cursor && (
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
