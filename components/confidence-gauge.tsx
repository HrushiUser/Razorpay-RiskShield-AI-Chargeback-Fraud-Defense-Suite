'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ConfidenceGaugeProps {
  value: number;
  size?: number;
  label?: string;
}

export function ConfidenceGauge({ value, size = 200, label = 'Confidence Score' }: ConfidenceGaugeProps) {
  const radius = size / 2 - 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  const isWarning = value < 70;
  const isCritical = value < 50;
  const color = isCritical ? 'hsl(var(--destructive))' : isWarning ? 'hsl(var(--warning))' : 'hsl(var(--success))';

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="10"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={cn('text-4xl font-bold tabular-nums', isCritical ? 'text-destructive' : isWarning ? 'text-warning' : 'text-success')}
          >
            {value}
          </motion.span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">out of 100</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{label}</p>
      {isWarning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className={cn(
            'mt-2 rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider',
            isCritical
              ? 'bg-destructive/15 text-destructive glow-destructive'
              : 'bg-warning/15 text-warning glow-warning'
          )}
        >
          {isCritical ? 'Critical — Manual Review Mandatory' : 'Human-in-the-loop Intervention Required'}
        </motion.div>
      )}
      {!isWarning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="mt-2 rounded-md bg-success/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-success glow-success"
        >
          Auto-Resolution Eligible
        </motion.div>
      )}
    </div>
  );
}
