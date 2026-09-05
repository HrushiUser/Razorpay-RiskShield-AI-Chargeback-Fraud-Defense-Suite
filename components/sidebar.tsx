'use client';

import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Scale,
  FileScan,
  ShieldCheck,
  BarChart3,
  Shield,
  CircleDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewKey =
  | 'dashboard'
  | 'disputes'
  | 'extraction'
  | 'guardrails'
  | 'analytics';

interface SidebarProps {
  activeView: ViewKey;
  onViewChange: (view: ViewKey) => void;
}

const navItems: {
  key: ViewKey;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
}[] = [
  { key: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, description: 'Real-time risk metrics' },
  { key: 'disputes', label: 'Live Disputes', icon: Scale, description: 'Active chargeback queue' },
  { key: 'extraction', label: 'Document Extraction Suite', icon: FileScan, description: 'OCR & evidence generation' },
  { key: 'guardrails', label: 'AI Guardrail Logs', icon: ShieldCheck, description: 'Rule audit trail' },
  { key: 'analytics', label: 'Metric Analytics', icon: BarChart3, description: 'Performance benchmarks' },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="flex h-screen w-72 flex-col border-r border-border bg-card/40 backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-border px-6 py-5">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
          <Shield className="h-5 w-5 text-primary" />
          <div className="absolute inset-0 rounded-xl bg-primary/5 pulse-glow animate-pulse-glow" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground">
            RiskShield <span className="text-primary">AI</span>
          </h1>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Chargeback Defense Suite
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {navItems.map((item) => {
          const isActive = activeView === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onViewChange(item.key)}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              <div className="flex-1 min-w-0">
                <p className={cn('text-[13px] font-medium leading-tight', isActive && 'text-foreground')}>
                  {item.label}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-border px-4 py-4">
        <div className="rounded-lg bg-secondary/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <CircleDot className="h-3 w-3 text-success animate-pulse" />
            <span className="text-[11px] font-medium text-success">System Online</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Dual-engine active: LLM + rule-based fallback. All guardrails operational.
          </p>
        </div>
        <p className="mt-3 text-center text-[9px] text-muted-foreground/60">
          Razorpay Buildathon · Track 02
        </p>
      </div>
    </aside>
  );
}
