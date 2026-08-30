import React from 'react';
import { cn } from '../../lib/utils';

export function GlassCard({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[20px] bg-white/60 backdrop-blur-[18px] backdrop-saturate-[140%] border border-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_10px_30px_-12px_rgba(8,22,53,0.18)] dark:bg-[#0C142C]/55 dark:border-white/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_30px_-12px_rgba(0,0,0,0.5)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
