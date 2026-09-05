'use client';

import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  ShieldCheck,
  TrendingUp,
  Zap,
  AlertTriangle,
  IndianRupee,
  Trophy,
  Bot,
  Activity,
} from 'lucide-react';
import { MetricCard } from '@/components/metric-card';
import {
  mockMetrics,
  mockTimeSeries,
  mockRiskDistribution,
  mockDisputes,
  formatCurrency,
  statusConfig,
  reasonLabels,
  riskLevelConfig,
} from '@/lib/mock-data';

const riskColors: Record<string, string> = {
  low: 'hsl(var(--success))',
  medium: 'hsl(var(--warning))',
  high: 'hsl(var(--destructive))',
  critical: 'hsl(0 84% 40%)',
};

export function DashboardView() {
  const recentDisputes = mockDisputes.slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Dashboard Overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time chargeback defense metrics and guardrail performance
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Revenue Guarded"
          value={formatCurrency(mockMetrics.totalRevenueGuarded)}
          icon={IndianRupee}
          trend={{ value: '12.4%', positive: true }}
          accent="primary"
          delay={0}
        />
        <MetricCard
          label="Chargeback Win-Rate"
          value={`${mockMetrics.chargebackWinRate}%`}
          icon={Trophy}
          trend={{ value: '3.1%', positive: true }}
          accent="success"
          delay={0.08}
        />
        <MetricCard
          label="Auto-Resolution Rate"
          value={`${mockMetrics.autoResolutionRate}%`}
          icon={Bot}
          trend={{ value: '5.8%', positive: true }}
          accent="primary"
          delay={0.16}
        />
        <MetricCard
          label="Guardrail Interventions"
          value={mockMetrics.guardrailInterventions.toLocaleString('en-IN')}
          icon={ShieldCheck}
          trend={{ value: '18.2%', positive: true }}
          accent="warning"
          delay={0.24}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Dispute Resolution Trend</h3>
              <p className="text-[11px] text-muted-foreground">Last 30 days</p>
            </div>
            <div className="flex gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary" /> Won
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-success" /> Auto-Resolved
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-destructive" /> Lost
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={mockTimeSeries}>
              <defs>
                <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAuto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickFormatter={(v) => v.slice(5)}
                interval={4}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="won" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorWon)" />
              <Area type="monotone" dataKey="autoResolved" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#colorAuto)" />
              <Area type="monotone" dataKey="lost" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#colorLost)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm"
        >
          <h3 className="mb-4 text-sm font-semibold text-foreground">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={mockRiskDistribution}
                dataKey="count"
                nameKey="level"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
              >
                {mockRiskDistribution.map((entry) => (
                  <Cell key={entry.level} fill={riskColors[entry.level]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {mockRiskDistribution.map((r) => (
              <div key={r.level} className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: riskColors[r.level] }} />
                  {riskLevelConfig[r.level].label}
                </span>
                <span className="font-medium text-foreground">{r.count} ({r.percentage}%)</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm"
        >
          <h3 className="mb-4 text-sm font-semibold text-foreground">Fraud Blocked by Day</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={mockTimeSeries.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={9} tickFormatter={(v) => v.slice(5)} interval={2} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="fraudBlocked" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Recent Disputes</h3>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            {recentDisputes.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 px-3 py-2.5 transition-colors hover:bg-secondary/40"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-1 rounded-full`} style={{ backgroundColor: riskColors[d.riskLevel] }} />
                  <div>
                    <p className="text-[12px] font-medium text-foreground">{d.id} · {reasonLabels[d.reason]}</p>
                    <p className="text-[10px] text-muted-foreground">{d.transaction.merchantName} · {d.transaction.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-semibold text-foreground">₹{d.chargebackAmount.toLocaleString('en-IN')}</span>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${statusConfig[d.status].bg} ${statusConfig[d.status].text}`}>
                    {statusConfig[d.status].label}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
