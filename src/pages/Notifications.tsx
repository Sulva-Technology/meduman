import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle2, ShieldCheck, Wallet, AlertOctagon, FileText } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { apiClient } from '../lib/api';
import { cn, formatMoney } from '../lib/utils';
import type { NotificationView } from '../lib/types';
import { useNavigate } from 'react-router-dom';

/**
 * Presentation derived from the row the backend actually stores
 * (`templateKey` + `payload`). The API has no title/body/link fields, so an
 * unrecognised key falls back to a humanised key rather than invented copy.
 */
function present(n: NotificationView): { title: string; body: string; link?: string } {
  const p = (n.payload ?? {}) as Record<string, unknown>;

  switch (n.templateKey) {
    case 'invoice.sent': {
      const number = typeof p.number === 'string' ? p.number : null;
      const total = typeof p.total === 'number' ? p.total : null;
      const viewId = typeof p.publicViewId === 'string' ? p.publicViewId : null;
      return {
        title: number ? `Invoice ${number}` : 'Invoice received',
        body: total === null ? 'An invoice was sent to you.' : `You have an invoice for ${formatMoney(total)}.`,
        ...(viewId ? { link: `/invoice/${viewId}` } : {}),
      };
    }
    case 'otp.delivery_confirmation':
      // The code itself never rides the inbox row — only the fact a code was sent.
      return {
        title: 'Confirmation code sent',
        body: 'A one-time code was sent to you to confirm delivery.',
      };
    default:
      return {
        title: n.templateKey.split('.').pop()?.replace(/_/g, ' ') ?? 'Notification',
        body: `Update: ${n.templateKey}`,
      };
  }
}

function iconFor(templateKey: string) {
  if (templateKey.startsWith('invoice.')) return <FileText className="w-5 h-5 text-brand" />;
  if (templateKey.startsWith('otp.')) return <ShieldCheck className="w-5 h-5 text-warning" />;
  if (templateKey.startsWith('payout.')) return <Wallet className="w-5 h-5 text-success" />;
  if (templateKey.startsWith('payment.')) return <CheckCircle2 className="w-5 h-5 text-success" />;
  if (templateKey.startsWith('dispute.')) return <AlertOctagon className="w-5 h-5 text-danger" />;
  return <Bell className="w-5 h-5 text-muted" />;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const rows = await apiClient<NotificationView[]>('/notifications');
        if (!cancelled) setNotifications(rows);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load notifications.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  async function markRead(id: string) {
    // Optimistic: the server call is idempotent and ownership-scoped.
    setNotifications((prev) =>
      prev.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    try {
      await apiClient<{ ok: true }>(`/notifications/${id}/read`, { method: 'POST' });
    } catch {
      // Leave the optimistic state; the next load reflects the server's truth.
    }
  }

  async function handleMarkAllRead() {
    // No bulk endpoint exists — mark each unread row individually.
    const unread = notifications.filter((n) => !n.readAt);
    await Promise.all(unread.map((n) => markRead(n.id)));
  }

  function handleNotificationClick(notif: NotificationView) {
    void markRead(notif.id);
    const { link } = present(notif);
    if (link) navigate(link);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-ink">Notifications</h1>
        {notifications.some((n) => !n.readAt) && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>Mark all read</Button>
        )}
      </div>

      <GlassCard className="p-2 sm:p-4">
        {loading ? (
          <div className="space-y-3 px-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-line/30 rounded-xl animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="py-20 text-center flex flex-col items-center">
            <AlertOctagon className="w-12 h-12 text-danger mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-ink">Could not load notifications</h3>
            <p className="text-muted mt-1">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <Bell className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-ink">You're all caught up</h3>
            <p className="text-muted mt-1">No new notifications right now.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notif) => {
              const { title, body } = present(notif);
              const unread = !notif.readAt;
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    'p-4 rounded-xl flex gap-4 cursor-pointer transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]',
                    unread ? 'bg-brand/5 dark:bg-brand/10' : 'bg-transparent',
                  )}
                >
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', unread ? 'bg-white dark:bg-canvas-ink shadow-sm' : 'bg-surface/50')}>
                    {iconFor(notif.templateKey)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className={cn('text-sm font-semibold truncate', unread ? 'text-ink' : 'text-ink/80')}>{title}</p>
                      <span className="text-xs text-muted whitespace-nowrap">{new Date(notif.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-muted line-clamp-1">{body}</p>
                  </div>
                  {unread && <div className="w-2 h-2 rounded-full bg-brand shrink-0 mt-2" />}
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
