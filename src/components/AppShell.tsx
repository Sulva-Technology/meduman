import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  ListOrdered, 
  FileText, 
  AlertOctagon, 
  Wallet, 
  Bell, 
  Settings,
  Menu,
  X,
  Search,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { apiClient, ApiError } from '../lib/api';
import { normalizeUser, type ApiUser, type AppUser } from '../lib/types';
import { cn } from '../lib/utils';
import { GlassCard } from './ui/GlassCard';
import { Button } from './ui/Button';

export const UserContext = React.createContext<{
  user: AppUser | null;
  setUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
}>({ user: null, setUser: () => {} });

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/app' },
  { label: 'Transactions', icon: ListOrdered, path: '/app/transactions' },
  { label: 'Invoices', icon: FileText, path: '/app/invoices' },
  { label: 'Disputes', icon: AlertOctagon, path: '/app/disputes' },
  { label: 'Payouts', icon: Wallet, path: '/app/payouts' },
  { label: 'Notifications', icon: Bell, path: '/app/notifications' },
  { label: 'Settings', icon: Settings, path: '/app/settings' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser() {
      if (!supabase) {
        navigate('/login');
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      try {
        // skipAuthRedirect: a 401 here (backend rejecting the Supabase JWT) must
        // surface as an error card, not a silent hard-redirect to /login — the
        // bounce looks exactly like "login failed" and hides the real cause.
        const apiUser = await apiClient<ApiUser>(‘/users/me’, { skipAuthRedirect: true });
        // app_metadata is server-controlled and cannot be edited by the user,
        // so it is safe to read the admin flag from the decoded session claims.
        const appRole = (session.user.app_metadata as { role?: string } | undefined)?.role;
        setUser(normalizeUser(apiUser, appRole));
      } catch (err) {
        // Never fabricate an identity — a wrong role here would show the wrong
        // money. Surface the failure and let the user retry or sign out.
        console.error(‘Failed to load user profile:’, err);
        const rejectedSession = err instanceof ApiError && err.status === 401;
        setLoadError(rejectedSession
          ? ‘Your session was rejected by the server (401). Please sign out and try again.’
          : err instanceof TypeError
            ? ‘We couldn’t connect to the account service. Please try again in a moment.’
            : err instanceof Error ? err.message : ‘Could not load your profile.’);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [navigate]);

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-10 w-10 bg-line rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-line rounded"></div>
        </div>
      </div>
    );
  }

  if (loadError || !user) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <GlassCard role="alert" className="p-6 sm:p-8 w-full max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-5">
            <AlertOctagon aria-hidden="true" className="w-7 h-7 text-danger" />
          </div>
          <h1 className="text-xl font-display font-bold text-ink mb-3">Couldn't load your account</h1>
          <p className="text-sm leading-relaxed text-muted mb-6">{loadError || 'Your profile is unavailable.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => window.location.reload()}
            >
              Try again
            </Button>
            <Button
              variant="secondary"
              onClick={handleSignOut}
            >
              Sign out
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  const items = [...NAV_ITEMS];
  if (user.isAdmin) {
    items.push({ label: 'Admin', icon: ShieldAlert, path: '/admin' });
  }

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <div className="min-h-screen bg-canvas text-ink flex relative overflow-hidden">
        {/* Background Aurora */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
           <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-brand/5 blur-[120px] animate-pulse-soft" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-success/5 blur-[100px] animate-float-slow" />
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-20 p-4">
          <GlassCard className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="p-6 flex items-center gap-3">
              <img src="/brand/meduman-logo-slate-navy.png" alt="Meduman" className="h-8" />
            </div>
            
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-4">
              {items.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/app' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-brand text-white shadow-sm" 
                        : "text-muted hover:bg-black/5 dark:hover:bg-white/10 hover:text-ink"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-line/50">
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-10 h-10 rounded-full bg-brand-050 flex items-center justify-center text-brand font-bold uppercase shrink-0">
                  {user.name[0] || 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-muted truncate capitalize">{user.activeRole} Account</p>
                </div>
              </div>
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:bg-danger/10 hover:text-danger transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </GlassCard>
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 inset-x-0 h-16 z-30 bg-canvas/80 backdrop-blur-xl border-b border-line flex items-center justify-between px-4">
          <img src="/brand/meduman-logo-slate-navy.png" alt="Meduman" className="h-7" />
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-ink">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden fixed inset-0 z-20 bg-canvas pt-16 flex flex-col"
            >
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {items.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/app' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-medium transition-colors",
                        isActive 
                          ? "bg-brand text-white shadow-sm" 
                          : "text-muted hover:bg-black/5 hover:text-ink"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-6 border-t border-line">
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-danger bg-danger/10"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 w-full md:pl-64 flex flex-col min-h-screen relative z-10">
          {/* Topbar */}
          <header className="hidden md:flex h-20 items-center justify-between px-8">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  type="text" 
                  placeholder="Search transactions..."
                  className="w-full h-10 pl-9 pr-4 rounded-full border border-line bg-surface/50 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 ml-4">
              <button className="w-10 h-10 rounded-full bg-surface/50 backdrop-blur-sm border border-line flex items-center justify-center text-muted hover:text-ink transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full" />
              </button>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 p-4 md:p-8 pt-20 md:pt-0 overflow-y-auto">
            <div className="max-w-6xl mx-auto pb-24 md:pb-0">
              {children}
            </div>
          </div>
        </main>
      </div>
    </UserContext.Provider>
  );
}
