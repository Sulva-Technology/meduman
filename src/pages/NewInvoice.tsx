import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, ShieldCheck, Copy, AlertOctagon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { MoneyText } from '../components/ui/MoneyText';
import { apiClient } from '../lib/api';
import type { CreateInvoiceBody, InvoiceDetail, InvoiceLineInput, Transaction } from '../lib/types';
import { nairaToKobo, percentToBasisPoints, previewInvoiceTotals } from '../lib/utils';

/** A line as the form holds it — raw strings, converted to integer kobo on submit. */
interface DraftLine {
  title: string;
  description: string;
  qty: string;
  price: string;
}

const EMPTY_LINE: DraftLine = { title: '', description: '', qty: '1', price: '' };

/** What the success screen needs. `payLinkId` comes from the minted transaction. */
interface SentResult {
  invoice: InvoiceDetail;
  payLinkId: string | null;
}

export default function NewInvoice() {
  const navigate = useNavigate();
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([{ ...EMPTY_LINE }]);
  const [taxPercent, setTaxPercent] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<SentResult | null>(null);

  // Preview only. The server recomputes every figure from the line inputs and
  // ignores anything money-shaped we might send (money rule 1).
  const previewLines = lines.map(l => ({
    quantity: Math.max(1, Math.trunc(Number(l.qty) || 0)),
    unitPrice: nairaToKobo(l.price) ?? 0,
  }));
  const taxRatePctBp = percentToBasisPoints(taxPercent);
  const { subtotal, taxAmount, total } = previewInvoiceTotals(previewLines, taxRatePctBp);

  const addLine = () => setLines([...lines, { ...EMPTY_LINE }]);
  const removeLine = (index: number) => setLines(lines.filter((_, i) => i !== index));
  const updateLine = (index: number, field: keyof DraftLine, value: string) => {
    setLines(lines.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  /** Validate + shape the CreateInvoiceDto body. Throws with a readable message. */
  function buildBody(): CreateInvoiceBody {
    const lineItems: InvoiceLineInput[] = lines.map((l, i) => {
      const title = l.title.trim();
      if (!title) throw new Error(`Item ${i + 1} needs a title.`);
      const quantity = Number(l.qty);
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error(`Item ${i + 1} needs a whole quantity of 1 or more.`);
      }
      const unitPrice = nairaToKobo(l.price);
      if (unitPrice === null) {
        throw new Error(`Item ${i + 1} needs a valid price (up to 2 decimal places).`);
      }
      return {
        title,
        quantity,
        unitPrice,
        ...(l.description.trim() ? { description: l.description.trim() } : {}),
      };
    });
    if (lineItems.length === 0) throw new Error('Add at least one line item.');

    if (taxPercent.trim() && taxRatePctBp === null) {
      throw new Error('Tax rate must be a percentage between 0 and 100.');
    }

    return {
      lineItems,
      ...(buyerName.trim() ? { buyerName: buyerName.trim() } : {}),
      ...(buyerEmail.trim() ? { buyerEmail: buyerEmail.trim() } : {}),
      ...(dueDate ? { dueDate: new Date(`${dueDate}T00:00:00.000Z`).toISOString() } : {}),
      ...(taxRatePctBp !== null ? { taxRatePctBp } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };
  }

  async function createDraft(): Promise<InvoiceDetail> {
    return apiClient<InvoiceDetail>('/invoices', {
      method: 'POST',
      body: JSON.stringify(buildBody()),
    });
  }

  const handleSaveDraft = async () => {
    setSaving(true);
    setError(null);
    try {
      await createDraft();
      navigate('/app/invoices');
    } catch (err) {
      console.error('Could not save the draft invoice:', err);
      setError(err instanceof Error ? err.message : 'Could not save this draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    setSaving(true);
    setError(null);
    try {
      const draft = await createDraft();
      // Sending mints exactly one protected transaction and allocates the
      // seller-sequential number. Idempotent server-side — a retry mints nothing.
      const invoice = await apiClient<InvoiceDetail>(`/invoices/${draft.id}/send`, { method: 'POST' });

      // The invoice row carries only transactionId; the shareable pay link is
      // the transaction's server-owned publicLinkId.
      let payLinkId: string | null = null;
      if (invoice.transactionId) {
        try {
          const tx = await apiClient<Transaction>(`/transactions/${invoice.transactionId}`);
          payLinkId = tx.publicLinkId;
        } catch (err) {
          console.error('Invoice sent, but the pay link could not be read back:', err);
        }
      }
      setSent({ invoice, payLinkId });
    } catch (err) {
      console.error('Could not send the invoice:', err);
      setError(err instanceof Error ? err.message : 'Could not send this invoice.');
    } finally {
      setSaving(false);
    }
  };

  if (sent) {
    const publicUrl = `${window.location.origin}/invoice/${sent.invoice.publicViewId}`;
    const payUrl = sent.payLinkId ? `${window.location.origin}/pay/${sent.payLinkId}` : null;
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <GlassCard className="p-10">
          <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-6">
            <ShieldCheck className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-2xl font-display font-bold text-ink mb-2">
            {sent.invoice.number || 'Invoice'} sent
          </h2>
          <p className="text-muted mb-8">A protected payment link has been minted for this invoice.</p>

          {payUrl && (
            <div className="text-left mb-6">
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Pay link</p>
              <div className="flex items-center gap-2 p-1.5 pl-4 bg-surface border border-line rounded-full">
                <div className="flex-1 text-sm font-medium truncate text-ink">{payUrl}</div>
                <Button size="sm" className="rounded-full shrink-0 h-9" onClick={() => navigator.clipboard.writeText(payUrl)}>
                  <Copy className="w-4 h-4 mr-1.5" /> Copy
                </Button>
              </div>
            </div>
          )}

          <div className="text-left mb-8">
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Invoice link</p>
            <div className="flex items-center gap-2 p-1.5 pl-4 bg-surface border border-line rounded-full">
              <div className="flex-1 text-sm font-medium truncate text-ink">{publicUrl}</div>
              <Button size="sm" variant="secondary" className="rounded-full shrink-0 h-9" onClick={() => navigator.clipboard.writeText(publicUrl)}>
                <Copy className="w-4 h-4 mr-1.5" /> Copy
              </Button>
            </div>
          </div>

          <div className="flex justify-between text-sm mb-8 px-1">
            <span className="text-muted">Total</span>
            <MoneyText amountInKobo={sent.invoice.total} className="text-ink" />
          </div>

          <Button variant="secondary" className="w-full" onClick={() => navigate('/app/invoices')}>
            Back to Invoices
          </Button>
        </GlassCard>
      </div>
    );
  }

  const canSubmit = !saving && lines.some(l => l.title.trim()) && total > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <button onClick={() => navigate('/app/invoices')} className="flex items-center text-sm font-medium text-muted hover:text-ink transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Invoices
      </button>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Composer Form */}
        <div className="w-full lg:w-1/2 space-y-6">
          <h1 className="text-3xl font-display font-bold text-ink">New Invoice</h1>

          {error && (
            <div className="p-4 bg-danger/10 text-danger text-sm rounded-xl flex gap-2 items-start">
              <AlertOctagon className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <GlassCard className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-display font-bold text-ink mb-4">Customer Details</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Customer Name" value={buyerName} onChange={e => setBuyerName(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-line bg-surface text-ink focus:ring-brand" />
                <input type="email" placeholder="Customer Email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-line bg-surface text-ink focus:ring-brand" />
                <div className="flex gap-3 items-center">
                  <label className="text-sm font-medium text-ink whitespace-nowrap">Due date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="flex-1 h-11 px-4 rounded-xl border border-line bg-surface text-ink focus:ring-brand" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-line">
              <h2 className="text-lg font-display font-bold text-ink mb-4">Line Items</h2>
              <div className="space-y-4">
                {lines.map((item, i) => (
                  <div key={i} className="p-4 bg-surface/50 border border-line rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">Item {i + 1}</span>
                      {lines.length > 1 && (
                        <button onClick={() => removeLine(i)} className="text-danger hover:text-danger/80"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                    <input type="text" placeholder="Title" value={item.title} onChange={e => updateLine(i, 'title', e.target.value)} className="w-full h-11 px-4 rounded-xl border border-line bg-surface text-ink focus:ring-brand" />
                    <input type="text" placeholder="Description (optional)" value={item.description} onChange={e => updateLine(i, 'description', e.target.value)} className="w-full h-11 px-4 rounded-xl border border-line bg-surface text-ink focus:ring-brand" />
                    <div className="flex gap-3">
                      <input type="number" min="1" step="1" placeholder="Qty" value={item.qty} onChange={e => updateLine(i, 'qty', e.target.value)} className="w-24 h-11 px-4 text-center rounded-xl border border-line bg-surface text-ink focus:ring-brand" />
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">₦</span>
                        <input type="text" inputMode="decimal" placeholder="Unit Price" value={item.price} onChange={e => updateLine(i, 'price', e.target.value)} className="w-full h-11 pl-8 pr-4 rounded-xl border border-line bg-surface text-ink focus:ring-brand" />
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addLine} className="flex items-center gap-2 text-sm font-medium text-brand hover:text-brand-700">
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-line">
              <h2 className="text-lg font-display font-bold text-ink mb-4">Additional Details</h2>
              <div className="space-y-4">
                <div className="flex gap-3 items-center">
                  <label className="text-sm font-medium text-ink whitespace-nowrap">Tax Rate (%)</label>
                  <input type="number" step="0.01" min="0" max="100" placeholder="0" value={taxPercent} onChange={e => setTaxPercent(e.target.value)} className="w-32 h-11 px-4 rounded-xl border border-line bg-surface text-ink focus:ring-brand" />
                </div>
                <textarea placeholder="Notes (Optional)" value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-4 rounded-xl border border-line bg-surface text-ink h-24 resize-none focus:ring-brand" />
              </div>
            </div>

            <div className="pt-6 border-t border-line flex justify-end gap-3">
              <Button variant="secondary" disabled={saving || !lines.some(l => l.title.trim())} onClick={handleSaveDraft}>
                {saving ? 'Saving…' : 'Save Draft'}
              </Button>
              <Button onClick={handleSend} disabled={!canSubmit}>
                {saving ? 'Sending…' : 'Send Invoice'}
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Live Preview */}
        <div className="w-full lg:w-1/2 sticky top-24">
          <p className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Live Preview</p>
          <GlassCard className="p-8 bg-white dark:bg-canvas-ink/80 shadow-2xl">
            <div className="flex justify-between items-start mb-10">
              <div>
                <img src="/brand/meduman-logo-slate-navy.png" alt="Meduman" className="h-6 mb-4" />
                <h3 className="text-xl font-display font-bold text-ink">INVOICE</h3>
                <p className="text-sm text-muted mt-1">Number assigned when sent</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted mt-1">{new Date().toLocaleDateString()}</p>
                {dueDate && <p className="text-sm text-muted">Due {new Date(dueDate).toLocaleDateString()}</p>}
              </div>
            </div>

            <div className="mb-8">
              <p className="text-sm text-muted mb-1">Bill To</p>
              <p className="font-medium text-ink">{buyerName || 'Customer Name'}</p>
              <p className="text-sm text-muted">{buyerEmail || 'customer@example.com'}</p>
            </div>

            <div className="w-full border-t border-line mb-4" />

            <div className="space-y-4 mb-8">
              {lines.map((item, i) => (
                <div key={i} className="flex justify-between text-sm gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-ink truncate">{item.title || 'Item description'}</p>
                    <p className="text-muted">{previewLines[i].quantity} × ₦{item.price || '0'}</p>
                  </div>
                  <MoneyText
                    amountInKobo={previewLines[i].unitPrice * previewLines[i].quantity}
                    className="font-medium text-ink shrink-0"
                  />
                </div>
              ))}
            </div>

            <div className="w-full border-t border-line mb-4" />

            <div className="space-y-2 text-sm ml-auto w-1/2">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <MoneyText amountInKobo={subtotal} />
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-muted">
                  <span>Tax ({taxPercent || 0}%)</span>
                  <MoneyText amountInKobo={taxAmount} />
                </div>
              )}
              <div className="flex justify-between text-ink font-bold pt-2 border-t border-line">
                <span>Total</span>
                <MoneyText amountInKobo={total} />
              </div>
            </div>

            <div className="mt-8 p-3 bg-brand-050 rounded-lg text-xs text-brand-700 text-center">
              Totals are computed and finalized by Meduman's server on save.
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
