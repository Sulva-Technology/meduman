import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { AlertCircle, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { cn } from '../lib/utils';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    setLoading(true);
    setError(null);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    try {
      // Sync via GET /users/me to ensure user is created in the backend DB if there's a trigger or similar
      await apiClient('/users/me');
      navigate('/app');
    } catch (err) {
      // It might take a moment or require email verification.
      setError('Account created, but please verify your email if required.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-canvas">
      {/* Brand Panel */}
      <div className="hidden lg:flex w-1/2 bg-canvas-ink flex-col justify-center px-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand/10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand/20 via-canvas-ink to-canvas-ink blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <img src="/brand/meduman-logo-sovereign-dark.png" alt="Meduman" className="h-10 mb-8" />
          <h1 className="font-display text-4xl text-white font-bold leading-tight mb-4">
            Buy and sell online without fear.
          </h1>
          <p className="text-slate-300 text-lg max-w-md mb-12">
            Secure escrow protection for buyers, sellers, freelancers, and businesses trading through social channels.
          </p>
          <GlassCard className="p-6 inline-block bg-white/5 border-white/10 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-5 h-5 text-emerald-300" />
              <span className="font-medium">Funds Protected</span>
            </div>
            <p className="text-sm text-slate-300">₦150,000 held safely until delivery.</p>
          </GlassCard>
        </div>
      </div>

      {/* Auth Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden overflow-y-auto">
        <div className="w-full max-w-md relative z-10 my-auto">
          <div className="lg:hidden mb-8 flex justify-center">
             <img src="/brand/meduman-logo-slate-navy.png" alt="Meduman" className="h-10" />
          </div>

          <GlassCard className="p-8 sm:p-10">
            <h2 className="font-display text-2xl font-bold text-ink mb-2">Create an account</h2>
            <p className="text-muted text-sm mb-8">Join Meduman to protect your transactions.</p>

            {error && (
              <div className="mb-6 p-4 bg-danger/10 text-danger text-sm rounded-xl flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-line bg-surface text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                  placeholder="Jane Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-line bg-surface text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-line bg-surface text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">I want to mainly...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('buyer')}
                    className={cn(
                      "h-12 rounded-xl border flex items-center justify-center text-sm font-medium transition-all",
                      role === 'buyer' 
                        ? "border-brand bg-brand-050 text-brand" 
                        : "border-line bg-surface text-muted hover:border-brand/30"
                    )}
                  >
                    Buy Safely
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('seller')}
                    className={cn(
                      "h-12 rounded-xl border flex items-center justify-center text-sm font-medium transition-all",
                      role === 'seller' 
                        ? "border-brand bg-brand-050 text-brand" 
                        : "border-line bg-surface text-muted hover:border-brand/30"
                    )}
                  >
                    Sell & Protect
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-brand font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
