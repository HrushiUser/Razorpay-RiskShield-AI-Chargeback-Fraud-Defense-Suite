'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BenchmarkCardProps {
  label: string;
  value: string;
  target: string;
  icon: LucideIcon;
  accent: 'primary' | 'success' | 'warning' | 'destructive';
  delay?: number;
}

const accentConfig = {
  primary: { bg: 'bg-primary/10', text: 'text-primary' },
  success: { bg: 'bg-success/10', text: 'text-success' },
  warning: { bg: 'bg-warning/10', text: 'text-warning' },
  destructive: { bg: 'bg-destructive/10', text: 'text-destructive' },
};

export function BenchmarkCard({ label, value, target, icon: Icon, accent, delay = 0 }: BenchmarkCardProps) {
  const cfg = accentConfig[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm"
    >
      <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-lg', cfg.bg)}>
        <Icon className={cn('h-5 w-5', cfg.text)} />
      </div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Target: {target}</span>
        <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-bold uppercase', cfg.bg, cfg.text)}>Pass</span>
      </div>
    </motion.div>
  );
}
