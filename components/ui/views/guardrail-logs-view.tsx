'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  ShieldAlert,
  Ban,
  Bot,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { mockGuardrailLogs } from '@/lib/mock-data';
import type { GuardrailLog } from '@/lib/types';
import { cn } from '@/lib/utils';

const severityConfig = {
  info: { bg: 'bg-primary/10', text: 'text-primary', label: 'Info' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', label: 'Warning' },
  critical: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Critical' },
};

const actionConfig = {
  auto_resolve: { icon: Bot, label: 'Auto-Resolved', color: 'text-success', bg: 'bg-success/10' },
  flag_human: { icon: ShieldAlert, label: 'Human Review', color: 'text-warning', bg: 'bg-warning/10' },
  block: { icon: Ban, label: 'Blocked', color: 'text-destructive', bg: 'bg-destructive/10' },
  pass: { icon: CheckCircle2, label: 'Passed', color: 'text-primary', bg: 'bg-primary/10' },
};

export function GuardrailLogsView() {
  const [filter, setFilter] = useState<'all' | 'triggered' | 'passed'>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return mockGuardrailLogs;
    if (filter === 'triggered') return mockGuardrailLogs.filter((l) => l.triggered);
    return mockGuardrailLogs.filter((l) => !l.triggered);
  }, [filter]);

  const stats = useMemo(() => {
    const total = mockGuardrailLogs.length;
    const triggered = mockGuardrailLogs.filter((l) => l.triggered).length;
    const autoResolved = mockGuardrailLogs.filter((l) => l.action === 'auto_resolve').length;
    const blocked = mockGuardrailLogs.filter((l) => l.action === 'block').length;
    const avgLatency = Math.round(
      mockGuardrailLogs.reduce((sum, l) => sum + l.latencyMs, 0) / total
    );
    return { total, triggered, autoResolved, blocked, avgLatency };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">AI Guardrail Logs</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete audit trail of every guardrail evaluation — {stats.total} events logged
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatBox label="Total Events" value={stats.total.toString()} icon={ShieldCheck} color="text-primary" bg="bg-primary/10" />
        <StatBox label="Triggered" value={stats.triggered.toString()} icon={ShieldAlert} color="text-warning" bg="bg-warning/10" />
        <StatBox label="Auto-Resolved" value={stats.autoResolved.toString()} icon={Bot} color="text-success" bg="bg-success/10" />
        <StatBox label="Blocked" value={stats.blocked.toString()} icon={Ban} color="text-destructive" bg="bg-destructive/10" />
        <StatBox label="Avg Latency" value={`${stats.avgLatency}ms`} icon={Clock} color="text-primary" bg="bg-primary/10" />
      </div>

      <div className="flex gap-2">
        {(['all', 'triggered', 'passed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-lg px-4 py-2 text-[12px] font-medium capitalize transition-colors',
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
          >
            {f === 'all' ? 'All Events' : f === 'triggered' ? 'Triggered Only' : 'Passed Only'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((log, i) => (
          <GuardrailLogRow key={log.id} log={log} index={i} />
        ))}
      </div>
    </div>
  );
}

function GuardrailLogRow({ log, index }: { log: GuardrailLog; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const action = actionConfig[log.action];
  const ActionIcon = action.icon;
  const sev = severityConfig[log.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.5) }}
      className="rounded-lg border border-border bg-card/40 backdrop-blur-sm overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-secondary/20"
      >
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', action.bg)}>
          <ActionIcon className={cn('h-4 w-4', action.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-medium text-foreground">{log.guardrailName}</p>
            <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-bold uppercase', sev.bg, sev.text)}>
              {sev.label}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {log.disputeId} · {new Date(log.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-medium', action.bg, action.color)}>
            {action.label}
          </span>
          <span className="text-[11px] tabular-nums text-muted-foreground">{log.latencyMs}ms</span>
          <div className="flex items-center gap-1.5">
            <TrendingUp className={cn('h-3 w-3', log.confidenceScore >= 80 ? 'text-success' : log.confidenceScore >= 60 ? 'text-warning' : 'text-destructive')} />
            <span className={cn('text-[11px] font-semibold tabular-nums', log.confidenceScore >= 80 ? 'text-success' : log.confidenceScore >= 60 ? 'text-warning' : 'text-destructive')}>
              {log.confidenceScore}%
            </span>
          </div>
        </div>
      </button>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-t border-border px-4 py-3"
        >
          <div className="space-y-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Detail</p>
              <p className="text-[12px] text-foreground/90 mt-0.5">{log.detail}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Decision Path</p>
              <p className="text-[11px] font-mono text-foreground/70 mt-0.5 bg-secondary/20 rounded p-2">{log.decisionPath}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function StatBox({ label, value, icon: Icon, color, bg }: { label: string; value: string; icon: typeof Bot; color: string; bg: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-3">
      <div className={cn('mb-2 flex h-7 w-7 items-center justify-center rounded-md', bg)}>
        <Icon className={cn('h-3.5 w-3.5', color)} />
      </div>
      <p className="text-lg font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
