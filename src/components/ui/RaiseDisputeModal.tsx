import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, FileUp, X, CheckCircle2 } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Button } from './Button';

interface RaiseDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, files: File[]) => Promise<void>;
  loading: boolean;
}

export function RaiseDisputeModal({ isOpen, onClose, onSubmit, loading }: RaiseDisputeModalProps) {
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles([...files, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason, files);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg max-h-[90vh] flex flex-col">
        <GlassCard className="p-6 md:p-8 flex flex-col max-h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold text-ink flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-danger" /> Raise Dispute
            </h2>
            <button onClick={onClose} className="text-muted hover:text-ink"><X className="w-5 h-5" /></button>
          </div>

          <div className="overflow-y-auto pr-2 space-y-6">
            <div className="bg-danger/10 text-danger text-sm p-4 rounded-xl font-medium">
              Raising a dispute freezes the automated release of funds until the issue is resolved by our team.
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Reason for Dispute</label>
              <textarea 
                value={reason} 
                onChange={e => setReason(e.target.value)}
                placeholder="Explain what went wrong in detail..."
                className="w-full p-4 rounded-xl border border-line bg-surface text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand resize-none h-32"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Upload Evidence (Images/PDFs)</label>
              <div 
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-brand bg-brand/5' : 'border-line hover:border-brand/50'}`}
              >
                <FileUp className="w-8 h-8 text-muted mx-auto mb-3" />
                <p className="text-sm text-ink mb-1">Drag and drop files here</p>
                <p className="text-xs text-muted mb-4">or click to browse from your device</p>
                <label className="cursor-pointer">
                  <span className="bg-surface border border-line px-4 py-2 rounded-lg text-sm font-medium text-ink hover:bg-black/5 transition-colors">Select Files</span>
                  <input type="file" multiple className="hidden" onChange={handleChange} accept="image/*,.pdf" />
                </label>
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2 px-3 bg-surface border border-line rounded-lg text-sm">
                      <span className="truncate max-w-[200px] text-ink">{f.name}</span>
                      <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-danger hover:text-danger/80"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-line flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="destructive" onClick={handleSubmit} disabled={!reason.trim() || loading}>
              {loading ? 'Submitting...' : 'Submit Dispute'}
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
