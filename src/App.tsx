import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import PayPage from './pages/PayPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AppShell from './components/AppShell';
import { RequireAdmin } from './components/RequireAdmin';

import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import NewTransaction from './pages/NewTransaction';
import TransactionDetail from './pages/TransactionDetail';
import Disputes from './pages/Disputes';
import Settings from './pages/Settings';
import PayoutSettings from './pages/PayoutSettings';
import Notifications from './pages/Notifications';
import Payouts from './pages/Payouts';
import Invoices from './pages/Invoices';
import NewInvoice from './pages/NewInvoice';
import PublicInvoice from './pages/PublicInvoice';
import AdminDashboard from './pages/AdminDashboard';
import AdminTransactionDetail from './pages/AdminTransactionDetail';
import AdminDisputes from './pages/AdminDisputes';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/pay/:publicLinkId" element={<PayPage />} />
        <Route path="/invoice/:publicViewId" element={<PublicInvoice />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route path="/app" element={<AppShell><Dashboard /></AppShell>} />
        <Route path="/app/transactions" element={<AppShell><Transactions /></AppShell>} />
        <Route path="/app/transactions/new" element={<AppShell><NewTransaction /></AppShell>} />
        <Route path="/app/transactions/:id" element={<AppShell><TransactionDetail /></AppShell>} />
        
        <Route path="/app/disputes" element={<AppShell><Disputes /></AppShell>} />
        <Route path="/app/settings" element={<AppShell><Settings /></AppShell>} />
        <Route path="/app/settings/payout" element={<AppShell><PayoutSettings /></AppShell>} />
        <Route path="/app/notifications" element={<AppShell><Notifications /></AppShell>} />
        <Route path="/app/payouts" element={<AppShell><Payouts /></AppShell>} />
        
        <Route path="/app/invoices" element={<AppShell><Invoices /></AppShell>} />
        <Route path="/app/invoices/new" element={<AppShell><NewInvoice /></AppShell>} />

        {/* /admin/* is session-guarded by AppShell and role-guarded by
            RequireAdmin (JWT app_metadata.role). The API enforces @Roles('ADMIN')
            on every one of these endpoints independently. */}
        <Route path="/admin" element={<AppShell><RequireAdmin><AdminDashboard /></RequireAdmin></AppShell>} />
        <Route path="/admin/transactions/:id" element={<AppShell><RequireAdmin><AdminTransactionDetail /></RequireAdmin></AppShell>} />
        <Route path="/admin/disputes" element={<AppShell><RequireAdmin><AdminDisputes /></RequireAdmin></AppShell>} />
        
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
