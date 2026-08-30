import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertOctagon, ArrowRight, Search, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { StatusPill } from '../components/ui/StatusPill';
import { apiClient } from '../lib/api';
import type { Dispute, Paginated, Transaction } from '../lib/types';

/** A dispute joined to its transaction, for the cross-transaction table. */
interface DisputeRow extends Dispute {
  txId: string;
  txTitle: string;
}

export default function Disputes() {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // There is no user-scoped dispute list endpoint, so gather the caller's
        // transactions (as buyer and as seller) and fan out to the per-transaction
        // dispute reads. Bounded to the most recent transactions per role.
        const [asBuyer, asSeller] = await Promise.all([
          apiClient<Paginated<Transaction>>('/transactions?role=buyer&limit=50'),
          apiClient<Paginated<Transaction>>('/transactions?role=seller&limit=50'),
        ]);
        const txById = new Map<string, Transaction>();
        for (const tx of [...asBuyer.items, ...asSeller.items]) txById.set(tx.id, tx);

        const perTx = await Promise.all(
          [...txById.values()].map(async (tx) => {
            try {
              const ds = await apiClient<Dispute[]>(`/transactions/${tx.id}/disputes`);
              return ds.map((d) => ({ ...d, txId: tx.id, txTitle: tx.title }));
            } catch {
              return [] as DisputeRow[];
            }
          }),
        );
        const rows = perTx.flat().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        setDisputes(rows);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Could not load disputes.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-ink">Disputes</h1>
          <p className="text-muted mt-1">Manage active issues and track resolutions.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input 
            type="text" 
            placeholder="Search disputes..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-line bg-surface/50 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg">{error}</div>
      )}

      <GlassCard className="p-2 sm:p-4">
        {loading ? (
          <div className="space-y-3 px-2">
            {[1,2].map(i => <div key={i} className="h-20 bg-line/30 rounded-xl animate-pulse" />)}
          </div>
        ) : disputes.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <AlertOctagon className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-ink">No disputes — that's a good thing!</h3>
            <p className="text-muted mt-1">All your transactions are running smoothly.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line text-sm font-medium text-muted">
                  <th className="p-4 font-normal">Transaction Ref</th>
                  <th className="p-4 font-normal">Reason Summary</th>
                  <th className="p-4 font-normal">Status</th>
                  <th className="p-4 font-normal text-right">Opened Date</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {disputes.map(disp => (
                  <tr key={disp.id} className="border-b border-line/50 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => window.location.href = `/app/transactions/${disp.txId}`}>
                    <td className="p-4">
                      <p className="font-semibold text-ink">{disp.txTitle}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-ink max-w-md truncate">{disp.description || disp.reason.replace(/_/g, ' ').toLowerCase()}</p>
                    </td>
                    <td className="p-4">
                      <StatusPill status={disp.status.startsWith('RESOLVED') ? 'RELEASED' : disp.status === 'CANCELLED' ? 'CANCELLED' : 'DISPUTED'} />
                    </td>
                    <td className="p-4 text-right text-sm text-muted">
                      {new Date(disp.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-2 rounded-full text-muted hover:text-brand hover:bg-brand-050 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
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
