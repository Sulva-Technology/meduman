import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

import type { TransactionStatus } from '../../lib/types';

interface StatusPillProps {
  status: TransactionStatus | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; colorClass: string }> = {
  DRAFT: { label: 'Draft', colorClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },  LINK_ACTIVE: { label: 'Link Active', colorClass: 'bg-brand-050 text-brand dark:bg-brand-700/30 dark:text-brand-050' },
  PAYMENT_PENDING: { label: 'Payment Pending', colorClass: 'bg-brand-050 text-brand dark:bg-brand-700/30 dark:text-brand-050' },
  PAYMENT_PROTECTED: { label: 'Protected', colorClass: 'bg-warning/10 text-warning dark:bg-warning/20' },
  DELIVERY_IN_PROGRESS: { label: 'Delivering', colorClass: 'bg-warning/10 text-warning dark:bg-warning/20' },
  CONFIRMATION_PENDING: { label: 'Awaiting Confirmation', colorClass: 'bg-warning/10 text-warning dark:bg-warning/20' },
  DISPUTED: { label: 'Disputed', colorClass: 'bg-danger/10 text-danger dark:bg-danger/20' },
  RELEASE_PROCESSING: { label: 'Releasing', colorClass: 'bg-success/10 text-success dark:bg-success/20' },
  RELEASED: { label: 'Released', colorClass: 'bg-success/10 text-success dark:bg-success/20' },
  REFUND_PROCESSING: { label: 'Refunding', colorClass: 'bg-muted/10 text-muted dark:bg-muted/20' },
  REFUNDED: { label: 'Refunded', colorClass: 'bg-muted/10 text-muted dark:bg-muted/20' },
  CANCELLED: { label: 'Cancelled', colorClass: 'bg-muted/10 text-muted dark:bg-muted/20' },
  EXPIRED: { label: 'Expired', colorClass: 'bg-muted/10 text-muted dark:bg-muted/20' },

  // InvoiceStatus — DRAFT is shared with TransactionStatus above.
  SENT: { label: 'Sent', colorClass: 'bg-brand-050 text-brand dark:bg-brand-700/30 dark:text-brand-050' },
  VIEWED: { label: 'Viewed', colorClass: 'bg-brand-050 text-brand dark:bg-brand-700/30 dark:text-brand-050' },
  PAID: { label: 'Paid', colorClass: 'bg-success/10 text-success dark:bg-success/20' },
  OVERDUE: { label: 'Overdue', colorClass: 'bg-warning/10 text-warning dark:bg-warning/20' },
  VOID: { label: 'Void', colorClass: 'bg-muted/10 text-muted dark:bg-muted/20' },

  // PayoutStatus.
  PENDING: { label: 'Queued', colorClass: 'bg-muted/10 text-muted dark:bg-muted/20' },
  PROCESSING: { label: 'Sending', colorClass: 'bg-warning/10 text-warning dark:bg-warning/20' },
  SUCCESS: { label: 'Paid Out', colorClass: 'bg-success/10 text-success dark:bg-success/20' },
  FAILED: { label: 'Failed', colorClass: 'bg-danger/10 text-danger dark:bg-danger/20' },
  REVERSED: { label: 'Reversed', colorClass: 'bg-danger/10 text-danger dark:bg-danger/20' },

  // DisputeStatus — CANCELLED is shared with TransactionStatus above.
  OPEN: { label: 'Open', colorClass: 'bg-danger/10 text-danger dark:bg-danger/20' },
  UNDER_REVIEW: { label: 'Under Review', colorClass: 'bg-warning/10 text-warning dark:bg-warning/20' },
  RESOLVED_RELEASE: { label: 'Released', colorClass: 'bg-success/10 text-success dark:bg-success/20' },
  RESOLVED_REFUND: { label: 'Refunded', colorClass: 'bg-muted/10 text-muted dark:bg-muted/20' },
  RESOLVED_PARTIAL: { label: 'Partial', colorClass: 'bg-muted/10 text-muted dark:bg-muted/20' }
};

export function StatusPill({ status, className }: StatusPillProps) {
  const config = statusConfig[status] || { label: status, colorClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };

  return (
    <motion.span
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider",
        config.colorClass,
        className
      )}
    >
      {config.label}
    </motion.span>
  );
}
