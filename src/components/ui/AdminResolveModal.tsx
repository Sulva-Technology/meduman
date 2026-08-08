import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Button } from './Button';
import type { DisputeResolveOutcome } from '../../lib/types';

interface AdminResolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Drives POST /disputes/:id/resolve. The reason becomes the audited resolution. */
  onResolve: (outcome: DisputeResolveOutcome, resolution: string) => void;
  loading?: boolean;
  error?: string | null;
}

export function AdminResolveModal({ isOpen, onClose, onResolve, loading = false, error = null }: AdminResolveModalProps) {
  const [reason, setReason] = useState('');
  const [action, setAction] = useState<DisputeResolveOutcome>('RELEASE');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold text-ink">Resolve Dispute</h2>
            <button onClick={onClose} className="text-muted hover:text-ink"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex gap-2">
              <Button
                variant={action === 'RELEASE' ? 'primary' : 'secondary'}
                className="flex-1"
                onClick={() => setAction('RELEASE')}
              >
                Release to Seller
              </Button>
              <Button
                variant={action === 'REFUND' ? 'destructive' : 'secondary'}
                className="flex-1"
                onClick={() => setAction('REFUND')}
              >
                Refund to Buyer
              </Button>
            </div>

            <p className="text-xs text-muted">
              {action === 'RELEASE'
                ? 'Resolving for the seller unfreezes release and queues the payout.'
                : 'Resolving for the buyer moves the transaction into refund processing.'}
            </p>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Audit Reason (Required)</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                maxLength={2000}
                placeholder="Reason for this resolution..."
                className="w-full p-3 rounded-xl border border-line bg-surface text-ink h-24 resize-none focus:ring-brand"
              />
            </div>

            {error && <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg">{error}</div>}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button
              variant={action === 'REFUND' ? 'destructive' : 'primary'}
              onClick={() => onResolve(action, reason.trim())}
              disabled={!reason.trim() || loading}
            >
              {loading ? 'Resolving…' : 'Confirm Resolution'}
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
