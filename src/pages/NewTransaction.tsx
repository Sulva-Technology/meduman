import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ShieldCheck, Copy, Share2, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { MoneyText } from '../components/ui/MoneyText';
import { apiClient } from '../lib/api';
import { UserContext } from '../components/AppShell';
import { APP_URL } from '../lib/app';
import type { Transaction } from '../lib/types';

export default function NewTransaction() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedData, setPublishedData] = useState<{ id: string; publicLinkId: string; amount: number } | null>(null);
  const navigate = useNavigate();
  const { refreshUser } = useContext(UserContext);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState([{ name: '', price: '', qty: '1' }]);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');

  const calculateTotal = () => {
    return items.reduce((acc, item) => {
      const price = parseFloat(item.price) || 0;
      const qty = parseInt(item.qty) || 1;
      return acc + (price * 100 * qty); // convert naira to kobo
    }, 0);
  };

  const addItem = () => setItems([...items, { name: '', price: '', qty: '1' }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // The backend has no line-item endpoint yet, so fold the items + delivery note
  // into the transaction description. The server owns the amount (kobo) and the
  // release rule; we only send title + amount + description.
  const buildDescription = () => {
    const lines = items
      .filter((it) => it.name.trim())
      .map((it) => `${it.qty || '1'}x ${it.name} — ₦${(parseFloat(it.price || '0') * parseInt(it.qty || '1')).toLocaleString()}`);
    const parts = [];
    if (description.trim()) parts.push(description.trim());
    if (lines.length) parts.push(`Items:\n${lines.join('\n')}`);
    if (deliveryNote.trim()) parts.push(`Delivery: ${deliveryNote.trim()}`);
    if (buyerEmail.trim() || buyerPhone.trim()) {
      parts.push(`Buyer: ${[buyerEmail.trim(), buyerPhone.trim()].filter(Boolean).join(' · ')}`);
    }
    return parts.join('\n\n').slice(0, 2000) || undefined;
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Create the DRAFT — server owns status, publicLinkId, buyer.
      const tx = await apiClient<Transaction>('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          title,
          amount: calculateTotal(), // integer kobo
          description: buildDescription(),
        }),
      });
      // 2. Publish it so the pay link is live (DRAFT -> LINK_ACTIVE).
      await apiClient<Transaction>(`/transactions/${tx.id}/publish`, { method: 'POST' });
      // 3. Publishing is what grants the SELLER role server-side, and the dashboard
      // renders its view off that flag — so re-read the profile now. roleFlags is
      // server-owned; we refetch it, never write it.
      try {
        await refreshUser();
      } catch (refreshErr) {
        // The link is already live, so a stale role only mis-renders the dashboard
        // until the next load. Don't fail a successful publish over it.
        console.error('Failed to refresh the user profile:', refreshErr);
      }
      setPublishedData({ id: tx.id, publicLinkId: tx.publicLinkId, amount: tx.amount });
      setStep(4); // Success step
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Could not create the transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      {step < 4 && (
        <div className="mb-8">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/app/transactions')} className="flex items-center text-sm font-medium text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          
          <div className="mt-6 flex items-center justify-between">
            <h1 className="text-2xl font-display font-bold text-ink">New Protected Link</h1>
            <div className="flex gap-2">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-2 w-12 rounded-full ${s <= step ? 'bg-brand' : 'bg-line'}`} />
              ))}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <GlassCard className="p-6 md:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-display font-bold text-ink mb-2">Item Details</h2>
                <p className="text-sm text-muted">What are you selling? Be descriptive.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Transaction Title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Vintage Leather Jacket" className="w-full h-11 px-4 rounded-xl border border-line bg-surface text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Description (Optional)</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Condition, size, specifics..." className="w-full p-4 rounded-xl border border-line bg-surface text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all resize-none h-24" />
                </div>

                <div className="pt-4 border-t border-line">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-ink">Line Items</label>
                  </div>
                  <div className="space-y-3">
                    {items.map((item, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="flex-1">
                          <input type="text" placeholder="Item name" value={item.name} onChange={(e) => updateItem(i, 'name', e.target.value)} className="w-full h-11 px-4 rounded-xl border border-line bg-surface text-ink focus:ring-2 focus:ring-brand outline-none" />
                        </div>
                        <div className="w-24">
                          <input type="number" min="1" placeholder="Qty" value={item.qty} onChange={(e) => updateItem(i, 'qty', e.target.value)} className="w-full h-11 px-4 rounded-xl border border-line bg-surface text-ink focus:ring-2 focus:ring-brand outline-none text-center" />
                        </div>
                        <div className="w-32 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">₦</span>
                          <input type="number" placeholder="Price" value={item.price} onChange={(e) => updateItem(i, 'price', e.target.value)} className="w-full h-11 pl-8 pr-4 rounded-xl border border-line bg-surface text-ink focus:ring-2 focus:ring-brand outline-none" />
                        </div>
                        {items.length > 1 && (
                          <button onClick={() => removeItem(i)} className="h-11 w-11 flex items-center justify-center rounded-xl bg-danger/10 text-danger hover:bg-danger/20 transition-colors shrink-0">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={addItem} className="mt-3 flex items-center gap-2 text-sm font-medium text-brand hover:text-brand-700 transition-colors">
                    <Plus className="w-4 h-4" /> Add another item
                  </button>
                </div>

                <div className="pt-6 border-t border-line flex items-center justify-between">
                  <span className="font-medium text-ink">Total Amount</span>
                  <MoneyText amountInKobo={calculateTotal()} className="text-2xl font-display font-bold text-brand" />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!title || calculateTotal() === 0}>
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <GlassCard className="p-6 md:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-display font-bold text-ink mb-2">Buyer & Terms</h2>
                <p className="text-sm text-muted">Who is buying, and what are the delivery expectations?</p>
              </div>

              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Buyer Email (Optional)</label>
                    <input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="buyer@example.com" className="w-full h-11 px-4 rounded-xl border border-line bg-surface text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Buyer Phone (Optional)</label>
                    <input type="tel" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="+234..." className="w-full h-11 px-4 rounded-xl border border-line bg-surface text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand transition-all" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Delivery Expectation</label>
                  <textarea value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} placeholder="e.g. Expected delivery via GIG Logistics within 3 days..." className="w-full p-4 rounded-xl border border-line bg-surface text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand transition-all resize-none h-24" />
                </div>

                <div className="bg-brand-050 rounded-xl p-4 flex items-start gap-3 mt-4">
                  <ShieldCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-brand-700">Release Rule: Buyer Confirmation</h4>
                    <p className="text-sm text-brand-700/80 mt-1">
                      Meduman calculates and owns the totals — you can't be short-changed by a client edit. Funds are released when the buyer confirms delivery.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <Button onClick={() => setStep(3)}>
                  Review & Publish <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <GlassCard className="p-6 md:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-display font-bold text-ink mb-2">Review Transaction</h2>
                <p className="text-sm text-muted">Confirm details before publishing your link.</p>
              </div>

              <div className="bg-surface/50 rounded-2xl p-6 border border-line space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-ink">{title}</h3>
                    {buyerEmail && <p className="text-sm text-muted mt-1">For: {buyerEmail}</p>}
                  </div>
                  <MoneyText amountInKobo={calculateTotal()} className="text-xl font-display font-bold text-brand" />
                </div>
                
                <div className="pt-4 border-t border-line/50 space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted">{item.qty}x {item.name || 'Unnamed item'}</span>
                      <span className="text-ink font-medium">₦{(parseFloat(item.price || '0') * parseInt(item.qty || '1')).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg">{error}</div>
              )}

              <div className="pt-6 flex flex-col sm:flex-row justify-end gap-3">
                <Button variant="secondary" onClick={() => setStep(1)} disabled={loading}>Edit Details</Button>
                <Button onClick={handleCreate} disabled={loading}>
                  {loading ? 'Creating...' : 'Create & Publish Link'}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {step === 4 && publishedData && (
          <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center">
            <GlassCard className="p-10">
              <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-display font-bold text-ink mb-2">Link Published!</h2>
              <p className="text-muted mb-8">Share this secure payment link with your buyer. They can pay via card or transfer.</p>

              <div className="flex items-center gap-2 p-1.5 pl-4 bg-surface border border-line rounded-full mb-8">
                <div className="flex-1 text-sm font-medium truncate text-left text-ink">
                  {APP_URL}/pay/{publishedData.publicLinkId}
                </div>
                <Button size="sm" className="rounded-full shrink-0 h-9" onClick={() => navigator.clipboard.writeText(`${APP_URL}/pay/${publishedData.publicLinkId}`)}>
                  <Copy className="w-4 h-4 mr-1.5" /> Copy
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                <Button variant="secondary" className="w-full" onClick={() => window.open(`https://wa.me/?text=Pay securely for ${title}: ${APP_URL}/pay/${publishedData.publicLinkId}`)}>
                  <Share2 className="w-4 h-4 mr-2" /> Share to WhatsApp
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => navigate(`/app/transactions/${publishedData.id}`)}>
                  View Transaction Dashboard
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
