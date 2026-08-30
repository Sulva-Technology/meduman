import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../lib/api';
import type { BankOption, SellerProfileSelfView } from '../lib/types';

export default function PayoutSettings() {
  const [loading, setLoading] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState('');
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load the real bank list and any already-configured destination.
  useEffect(() => {
    async function load() {
      try {
        const [bankList, profile] = await Promise.all([
          apiClient<BankOption[]>('/users/me/seller/banks'),
          apiClient<SellerProfileSelfView>('/users/me/seller'),
        ]);
        setBanks(bankList);
        if (profile.settlementReady && profile.settlementAccountName) {
          setResolvedName(profile.settlementAccountName);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Could not load banks.');
      }
    }
    load();
  }, []);

  // One server call resolves the NUBAN with the bank AND creates the transfer
  // recipient. There is no resolve-only endpoint — the bank-verified name comes
  // back in the response, so we never trust a client-typed account name.
  const handleSave = async () => {
    if (accountNumber.length !== 10 || !bankCode) return;
    setLoading(true);
    setError(null);
    try {
      const profile = await apiClient<SellerProfileSelfView>('/users/me/seller/recipient', {
        method: 'POST',
        body: JSON.stringify({ bankCode, accountNumber }),
      });
      setResolvedName(profile.settlementAccountName ?? '');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't verify or save this account. Check the details.");
      setResolvedName('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-ink">Payout Destination</h1>
        <p className="text-muted mt-1">Connect where your released funds are paid.</p>
      </div>

      <GlassCard className="p-6 md:p-8 space-y-6">
        <div className="bg-brand-050 rounded-xl p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-brand shrink-0 mt-0.5" />
          <p className="text-sm text-brand-700 leading-relaxed">
            Meduman verifies your account with the bank — we only keep the last 4 digits on file for security.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-success/10 text-success text-sm rounded-lg flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Payout destination saved successfully!</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Select Bank</label>
            <div className="relative">
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-line bg-surface text-ink appearance-none focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="">Choose a bank...</option>
                {banks.map(b => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Account Number (NUBAN)</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="0123456789"
              className="w-full h-11 px-4 rounded-xl border border-line bg-surface text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {resolvedName && (
            <div className="p-4 bg-surface/50 border border-line rounded-xl mt-4">
              <p className="text-sm text-muted mb-1">Account Name (verified by bank)</p>
              <p className="font-semibold text-ink">{resolvedName}</p>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-line flex justify-end">
          <Button onClick={handleSave} disabled={!bankCode || accountNumber.length !== 10 || loading}>
            {loading ? 'Verifying & Saving...' : 'Save Payout Destination'}
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
