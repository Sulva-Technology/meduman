import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, AlertOctagon, FileQuestion } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { MoneyText } from '../components/ui/MoneyText';
import { StatusPill } from '../components/ui/StatusPill';
import { apiClient, ApiError } from '../lib/api';
import type { PublicInvoiceView } from '../lib/types';

/** Statuses where the buyer can still pay. VOID / PAID are terminal for paying. */
const PAYABLE_STATUSES = ['SENT', 'VIEWED', 'OVERDUE'];

export default function PublicInvoice() {
  const { publicViewId } = useParams<{ publicViewId: string }>();
  const [invoice, setInvoice] = useState<PublicInvoiceView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      if (!publicViewId) return;
      try {
        // `@Public()` on the backend — an unauthenticated buyer following a
        // link is the normal case, so no bearer token and no /login bounce.
        const view = await apiClient<PublicInvoiceView>(`/public/invoices/${publicViewId}`, {
          publicRoute: true,
        });
        if (cancelled) return;
        setInvoice(view);
      } catch (err) {
        if (cancelled) return;
        // A draft, a voided-away or a wrong id all 404 — never confirm which.
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          console.error('Failed to load invoice:', err);
          setError(err instanceof Error ? err.message : 'Could not load this invoice.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, [publicViewId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-line rounded-full mb-4"></div>
          <div className="h-6 w-48 bg-line rounded mb-2"></div>
        </div>
      </div>
    );
  }

  if (notFound || error || !invoice) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <GlassCard className="p-10 max-w-md text-center">
          {notFound ? (
            <>
              <FileQuestion className="w-12 h-12 text-muted mx-auto mb-4" />
              <h1 className="text-xl font-display font-bold text-ink mb-2">Invoice not available</h1>
              <p className="text-sm text-muted">
                This invoice link is not active. Ask the sender for an up-to-date link.
              </p>
            </>
          ) : (
            <>
              <AlertOctagon className="w-12 h-12 text-danger mx-auto mb-4" />
              <h1 className="text-xl font-display font-bold text-ink mb-2">Couldn't load this invoice</h1>
              <p className="text-sm text-muted mb-6">{error}</p>
              <Button onClick={() => window.location.reload()}>Try again</Button>
            </>
          )}
        </GlassCard>
      </div>
    );
  }

  const canPay = PAYABLE_STATUSES.includes(invoice.status) && Boolean(invoice.payLinkId);

  return (
    <div className="min-h-screen bg-canvas py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[100px] animate-pulse-soft pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto relative z-10 space-y-8">
        {/* Reassurance Strip */}
        <div className="bg-brand-050 rounded-xl p-4 flex items-center justify-center gap-3 shadow-sm border border-brand/10">
          <ShieldCheck className="w-5 h-5 text-brand shrink-0" />
          <p className="text-sm font-medium text-brand-700">
            Paying this invoice protects your money with Meduman until you confirm delivery.
          </p>
        </div>

        <GlassCard className="p-8 md:p-12 shadow-xl bg-white/80 dark:bg-canvas-ink/80 print:shadow-none print:border-none print:bg-white">
          <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-6">
            <div>
              <img src="/brand/meduman-logo-slate-navy.png" alt="Meduman" className="h-8 mb-6 print:hidden" />
              <h1 className="text-3xl font-display font-bold text-ink">INVOICE</h1>
              <p className="text-muted mt-1">{invoice.number}</p>
              <div className="mt-4"><StatusPill status={invoice.status} /></div>
            </div>
            <div className="text-left md:text-right">
              <p className="font-semibold text-ink text-lg">{invoice.sellerName || 'Seller'}</p>
              <div className="mt-2 space-y-1 text-sm text-muted">
                <p>Issued: {new Date(invoice.issueDate).toLocaleDateString()}</p>
                {invoice.dueDate && <p>Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>}
              </div>
            </div>
          </div>

          {invoice.buyerName && (
            <div className="mb-10">
              <p className="text-sm text-muted mb-2 font-medium uppercase tracking-wider">Bill To</p>
              <p className="font-semibold text-ink text-lg">{invoice.buyerName}</p>
            </div>
          )}

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-y border-line text-sm font-semibold text-muted">
                  <th className="py-4 pr-4">Description</th>
                  <th className="py-4 px-4 text-center">Qty</th>
                  <th className="py-4 px-4 text-right">Unit Price</th>
                  <th className="py-4 pl-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/50">
                {invoice.lineItems.map((item, i) => (
                  <tr key={i}>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-ink">{item.title}</p>
                      {item.description && <p className="text-sm text-muted mt-1">{item.description}</p>}
                    </td>
                    <td className="py-4 px-4 text-center text-ink">{item.quantity}</td>
                    <td className="py-4 px-4 text-right">
                      <MoneyText amountInKobo={item.unitPrice} className="text-muted" />
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <MoneyText amountInKobo={item.lineTotal} className="font-medium text-ink" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 pt-6 border-t border-line flex justify-end">
            <div className="w-full max-w-sm space-y-3 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <MoneyText amountInKobo={invoice.subtotal} />
              </div>
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-muted">
                  <span>Tax</span>
                  <MoneyText amountInKobo={invoice.taxAmount} />
                </div>
              )}
              <div className="flex justify-between text-ink font-bold pt-3 border-t border-line text-lg">
                <span>Total</span>
                <MoneyText amountInKobo={invoice.total} className="text-2xl font-display text-brand" />
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-12 pt-6 border-t border-line">
              <p className="text-sm font-semibold text-ink mb-2">Notes</p>
              <p className="text-sm text-muted whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}

          {invoice.terms && (
            <div className="mt-6 pt-6 border-t border-line">
              <p className="text-sm font-semibold text-ink mb-2">Terms</p>
              <p className="text-sm text-muted whitespace-pre-line">{invoice.terms}</p>
            </div>
          )}
        </GlassCard>

        {/* Action Button outside print area */}
        <div className="flex justify-center mt-8 print:hidden">
          {canPay && (
            <Button
              size="lg"
              className="w-full max-w-sm shadow-xl"
              onClick={() => { window.location.href = `/pay/${invoice.payLinkId}`; }}
            >
              Pay Securely
            </Button>
          )}
          {invoice.status === 'PAID' && (
            <div className="bg-success/10 text-success px-6 py-3 rounded-full font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Paid &amp; Protected
            </div>
          )}
          {invoice.status === 'VOID' && (
            <div className="bg-muted/10 text-muted px-6 py-3 rounded-full font-bold flex items-center gap-2">
              <AlertOctagon className="w-5 h-5" /> This invoice was voided
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
