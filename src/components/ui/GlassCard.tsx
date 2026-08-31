import React from 'react';
import { cn } from '../../lib/utils';

export function GlassCard({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[20px] bg-surface text-ink border border-line shadow-[0_4px_24px_-12px_rgba(8,22,53,0.16)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
