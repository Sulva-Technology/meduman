import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, FileText, ExternalLink, Send, Bell, Ban, AlertOctagon, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { MoneyText } from '../components/ui/MoneyText';
import { apiClient } from '../lib/api';
import type { Invoice, InvoiceStatus, Paginated } from '../lib/types';
import { cn } from '../lib/utils';

/** Client-side tabs. The API filters on a single status; these span several. */
const FILTERS: Record<string, InvoiceStatus[] | null> = {
  ALL: null,
  DRAFT: ['DRAFT'],
  UNPAID: ['SENT', 'VIEWED', 'OVERDUE'],
  PAID: ['PAID'],
};

/** An invoice number is only allocated at send — a DRAFT row carries ''. */
const displayNumber = (inv: Invoice) => inv.number || 'Draft (unnumbered)';

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string | null>(null);

  async function loadFirstPage() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient<Paginated<Invoice>>('/invoices?limit=20');
      setInvoices(res.items);
      setNextCursor(res.nextCursor);
    } catch (err) {
      console.error('Failed to load invoices:', err);
      setError(err instanceof Error ? err.message : 'Could not load invoices.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await apiClient<Paginated<Invoice>>(`/invoices?limit=20&cursor=${nextCursor}`);
      setInvoices(prev => [...prev, ...res.items]);
      setNextCursor(res.nextCursor);
    } catch (err) {
      console.error('Failed to load more invoices:', err);
    } finally {
      setLoadingMore(false);
    }
  }

  /**
   * Lifecycle actions. Every one is server-decided: `send` mints the protected
   * transaction and allocates the number, `void` cancels the linked transaction,
   * `remind` re-delivers. We never write a status locally — always refetch.
   */
  async function runAction(id: string, action: 'send' | 'void' | 'remind') {
    setBusyId(id);
    setActionError(null);
    setActionNote(null);
    try {
      await apiClient(`/invoices/${id}/${action}`, { method: 'POST' });
      if (action === 'remind') {
        setActionNote('Reminder queued for delivery.');
      }
      await loadFirstPage();
    } catch (err) {
      console.error(`Invoice ${action} failed:`, err);
      setActionError(err instanceof Error ? err.message : `Could not ${action} this invoice.`);
    } finally {
      setBusyId(null);
    }
  }

  const allowed = FILTERS[filter];
  const filtered = invoices.filter(inv => {
    if (allowed && !allowed.includes(inv.status)) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      inv.number.toLowerCase().includes(q) ||
      (inv.buyerName ?? '').toLowerCase().includes(q) ||
      (inv.buyerEmail ?? '').toLowerCase().includes(q)
    );
  });

  const remindable: InvoiceStatus[] = ['SENT', 'VIEWED', 'OVERDUE'];
  const voidable: InvoiceStatus[] = ['DRAFT', 'SENT', 'VIEWED', 'OVERDUE'];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-ink">Invoices</h1>
        <Button onClick={() => navigate('/app/invoices/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {actionError && (
        <div className="p-3 bg-danger/10 text-danger text-sm rounded-xl">{actionError}</div>
      )}
      {actionNote && (
        <div className="p-3 bg-success/10 text-success text-sm rounded-xl">{actionNote}</div>
      )}

      <GlassCard className="p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {Object.keys(FILTERS).map(f => (
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
              placeholder="Search number or customer..."
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
            <h3 className="text-lg font-semibold text-ink">Couldn't load invoices</h3>
            <p className="text-muted mt-1 mb-5">{error}</p>
            <Button onClick={loadFirstPage}>Try again</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <FileText className="w-12 h-12 text-muted mb-4" />
            <h3 className="text-lg font-semibold text-ink">No invoices yet</h3>
            <p className="text-muted mt-1">Create your first invoice to request secure payment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line text-sm font-medium text-muted">
                  <th className="p-4 font-normal">Number &amp; Customer</th>
                  <th className="p-4 font-normal">Status</th>
                  <th className="p-4 font-normal text-right">Total</th>
                  <th className="p-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const busy = busyId === inv.id;
                  const publicUrl = `${window.location.origin}/invoice/${inv.publicViewId}`;
                  return (
                    <tr key={inv.id} className="border-b border-line/50 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-ink">{displayNumber(inv)}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {inv.buyerName || inv.buyerEmail || 'No customer contact'}
                        </p>
                      </td>
                      <td className="p-4"><StatusPill status={inv.status} /></td>
                      <td className="p-4 text-right">
                        <MoneyText amountInKobo={inv.total} className="font-medium text-ink" />
                        <p className="text-xs text-muted mt-0.5">
                          {new Date(inv.issueDate).toLocaleDateString()}
                          {inv.dueDate && ` · due ${new Date(inv.dueDate).toLocaleDateString()}`}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {inv.status === 'DRAFT' && (
                            <Button size="sm" disabled={busy || inv.total <= 0} onClick={() => runAction(inv.id, 'send')}>
                              <Send className="w-3.5 h-3.5 mr-1.5" /> {busy ? 'Sending…' : 'Send'}
                            </Button>
                          )}
                          {remindable.includes(inv.status) && (
                            <Button size="sm" variant="secondary" disabled={busy} onClick={() => runAction(inv.id, 'remind')}>
                              <Bell className="w-3.5 h-3.5 mr-1.5" /> Remind
                            </Button>
                          )}
                          {inv.status !== 'DRAFT' && (
                            <>
                              <button
                                title="Copy public invoice link"
                                onClick={() => navigator.clipboard.writeText(publicUrl)}
                                className="p-2 rounded-full text-muted hover:text-brand hover:bg-brand-050 transition-colors"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                title="Open public invoice"
                                onClick={() => window.open(`/invoice/${inv.publicViewId}`, '_blank')}
                                className="p-2 rounded-full text-muted hover:text-brand hover:bg-brand-050 transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {voidable.includes(inv.status) && (
                            <button
                              title="Void invoice"
                              disabled={busy}
                              onClick={() => runAction(inv.id, 'void')}
                              className="p-2 rounded-full text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-40"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
