import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Store, Wallet, Bell, Shield, Copy, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { UserContext } from '../components/AppShell';
import { cn } from '../lib/utils';
import { apiClient } from '../lib/api';
import type { SellerProfileSelfView } from '../lib/types';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const { user } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);

  // Seller profile — the only client-writable fields the API exposes are
  // businessName and category (UpdateSellerProfileDto). verificationStatus,
  // trustLevel and badgeSlug are server-owned and rendered read-only.
  const [seller, setSeller] = useState<SellerProfileSelfView | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (!user?.isSeller) return;
    let cancelled = false;
    async function loadSeller() {
      try {
        const profile = await apiClient<SellerProfileSelfView>('/users/me/seller');
        if (cancelled) return;
        setSeller(profile);
        setBusinessName(profile.businessName ?? '');
        setCategory(profile.category ?? '');
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load seller profile.');
      }
    }
    loadSeller();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSaveSeller = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await apiClient<SellerProfileSelfView>('/users/me/seller', {
        method: 'PATCH',
        body: JSON.stringify({ businessName, category }),
      });
      setSeller(updated);
      setBusinessName(updated.businessName ?? '');
      setCategory(updated.category ?? '');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save seller profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOutAll = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      navigate('/login');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-ink">Settings</h1>
        <p className="text-muted mt-1">Manage your account preferences and integrations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <GlassCard className="p-2 md:w-64 shrink-0 h-fit">
          <nav className="flex flex-col space-y-1">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              ...(user?.isSeller ? [{ id: 'seller', label: 'Seller Profile', icon: Store }] : []),
              { id: 'payout', label: 'Payout Settings', icon: Wallet },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'security', label: 'Security', icon: Shield },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'payout') {
                    navigate('/app/settings/payout');
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                  activeTab === tab.id 
                    ? "bg-brand text-white shadow-sm" 
                    : "text-muted hover:bg-black/5 dark:hover:bg-white/10 hover:text-ink"
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </GlassCard>

        <div className="flex-1">
          <GlassCard className="p-6 md:p-8">
            {success && (
              <div className="mb-6 p-3 bg-success/10 text-success text-sm rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <p>Settings saved successfully.</p>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-display font-bold text-ink mb-4">Personal Information</h2>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-full bg-brand-050 flex items-center justify-center text-2xl text-brand font-bold uppercase shrink-0">
                    {user?.name?.[0] || user?.email?.[0] || 'U'}
                  </div>
                </div>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Full Name</label>
                    <input type="text" value={user?.name || ''} readOnly className="w-full h-11 px-4 rounded-xl border border-line bg-surface/50 text-muted cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Email Address</label>
                    <input type="email" value={user?.email || ''} readOnly className="w-full h-11 px-4 rounded-xl border border-line bg-surface/50 text-muted cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Account Role</label>
                    <input
                      type="text"
                      value={[user?.isBuyer && 'Buyer', user?.isSeller && 'Seller', user?.isAdmin && 'Admin'].filter(Boolean).join(' · ') || '—'}
                      readOnly
                      className="w-full h-11 px-4 rounded-xl border border-line bg-surface/50 text-muted cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="pt-6 border-t border-line">
                  <p className="text-sm text-muted">
                    Your name and email come from your sign-in account and are managed there.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'seller' && (
              <div className="space-y-6">
                <h2 className="text-xl font-display font-bold text-ink mb-4">Seller Profile</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Business Name</label>
                    <input type="text" maxLength={120} value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Category</label>
                    <input type="text" maxLength={80} value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Fashion, Electronics" className="w-full h-11 px-4 rounded-xl border border-line bg-surface text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                  {seller?.badgeSlug && (
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Public Trust Badge</label>
                      <div className="flex items-center gap-2 p-1.5 pl-4 bg-surface border border-line rounded-xl">
                        <div className="flex-1 text-sm font-medium truncate text-ink">{`${window.location.origin}/s/${seller.badgeSlug}`}</div>
                        <Button size="sm" variant="secondary" className="rounded-lg h-9" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/s/${seller.badgeSlug}`)}><Copy className="w-4 h-4" /></Button>
                        <a href={`/s/${seller.badgeSlug}`} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="secondary" className="rounded-lg h-9"><ExternalLink className="w-4 h-4" /></Button>
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="p-4 bg-surface/50 border border-line rounded-xl">
                    <p className="text-sm font-medium text-ink mb-1">Verification Status</p>
                    <div className="flex items-center gap-2 text-sm text-warning font-semibold capitalize">
                      {seller ? seller.verificationStatus.toLowerCase().replace(/_/g, ' ') : '—'}
                    </div>
                  </div>
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
                <div className="pt-6 border-t border-line">
                  <Button onClick={handleSaveSeller} disabled={saving || !seller}>{saving ? 'Saving...' : 'Save Changes'}</Button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-display font-bold text-ink mb-4">Notification Preferences</h2>
                <div className="space-y-4 max-w-md">
                  <div className="flex items-center justify-between p-4 bg-surface/50 border border-line rounded-xl">
                    <div>
                      <p className="font-semibold text-ink">In-App Notifications</p>
                      <p className="text-sm text-muted">Required for core functionality</p>
                    </div>
                    <input type="checkbox" checked disabled className="w-5 h-5 rounded border-line text-brand focus:ring-brand accent-brand" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-surface border border-line rounded-xl">
                    <div>
                      <p className="font-semibold text-ink">Email Notifications</p>
                      <p className="text-sm text-muted">Receive updates via email</p>
                    </div>
                    <input type="checkbox" checked disabled className="w-5 h-5 rounded border-line text-brand focus:ring-brand accent-brand" />
                  </div>
                </div>
                <div className="pt-6 border-t border-line">
                  <p className="text-sm text-muted">
                    Notification channels are not configurable yet. Transaction-critical
                    messages are always delivered.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-display font-bold text-ink mb-4">Security</h2>
                <div className="space-y-4 max-w-md">
                  <div className="p-4 bg-surface/50 border border-line rounded-xl space-y-3">
                    <div>
                      <p className="text-sm font-medium text-ink mb-1">Current Session</p>
                      <p className="text-sm text-muted">Active on this device.</p>
                    </div>
                    <Button variant="destructive" onClick={handleSignOutAll}>Sign Out of All Devices</Button>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
}
