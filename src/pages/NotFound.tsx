import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
        <GlassCard className="p-10 text-center">
          <div className="mx-auto w-16 h-16 bg-muted/10 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert className="w-8 h-8 text-muted" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink mb-2">This page drifted out of protection.</h1>
          <p className="text-muted mb-8">We couldn't find the page you're looking for.</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/app')}>Go to Dashboard</Button>
            <Button variant="secondary" onClick={() => navigate('/')}>Back Home</Button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
