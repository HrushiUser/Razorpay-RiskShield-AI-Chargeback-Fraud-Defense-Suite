'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  accent: 'primary' | 'success' | 'warning' | 'destructive';
  delay?: number;
}

const accentConfig = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', glow: 'glow-primary' },
  success: { bg: 'bg-success/10', text: 'text-success', glow: 'glow-success' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', glow: 'glow-warning' },
  destructive: { bg: 'bg-destructive/10', text: 'text-destructive', glow: 'glow-destructive' },
};

export function MetricCard({ label, value, icon: Icon, trend, accent, delay = 0 }: MetricCardProps) {
  const cfg = accentConfig[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="group relative overflow-hidden rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm transition-all duration-300 hover:border-border/80 hover:bg-card/80"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {trend && (
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={cn(
                  'text-[11px] font-semibold',
                  trend.positive ? 'text-success' : 'text-destructive'
                )}
              >
                {trend.positive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-[10px] text-muted-foreground">vs last 30d</span>
            </div>
          )}
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg', cfg.bg)}>
          <Icon className={cn('h-5 w-5', cfg.text)} />
        </div>
      </div>
    </motion.div>
  );
}
