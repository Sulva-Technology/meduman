import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface MoneyTextProps {
  amountInKobo: number;
  className?: string;
  animate?: boolean;
}

export function MoneyText({ amountInKobo, className, animate = true }: MoneyTextProps) {
  // We can do a simple count up if animate is true, but for now just formatting precisely
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0, // usually 0 for social commerce unless necessary
  });

  const formatted = formatter.format(amountInKobo / 100);

  return (
    <motion.span 
      initial={animate ? { opacity: 0, y: 5 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      className={cn("tabular-nums font-semibold", className)}
    >
      {formatted}
    </motion.span>
  );
}
