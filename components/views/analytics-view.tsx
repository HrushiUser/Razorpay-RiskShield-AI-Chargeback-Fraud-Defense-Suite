'use client';

import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import {
  Target,
  Crosshair,
  Percent,
  Gauge,
  TrendingDown,
  IndianRupee,
} from 'lucide-react';
import { mockTimeSeries, mockMetrics } from '@/lib/mock-data';
import { BenchmarkCard } from './benchmark-card';

const benchmarkData = [
  { metric: 'Precision', value: 91.2, target: 85 },
  { metric: 'Recall', value: 87.5, target: 80 },
  { metric: 'F1-Score', value: 89.3, target: 82 },
  { metric: 'Specificity', value: 94.1, target: 90 },
  { metric: 'NPV', value: 88.7, target: 85 },
  { metric: 'Accuracy', value: 92.0, target: 88 },
];

const costAnalysis = [
  { category: 'Fraud Blocked', amount: 1845000, color: 'hsl(var(--success))' },
  { category: 'Chargebacks Won', amount: 1280000, color: 'hsl(var(--primary))' },
  { category: 'Auto-Resolved (Saved)', amount: 720000, color: 'hsl(var(--warning))' },
  { category: 'False Positive Cost', amount: -85000, color: 'hsl(var(--destructive))' },
  { category: 'Net Savings', amount: 2845000, color: 'hsl(var(--success))' },
];

const radarData = mockTimeSeries.slice(-14).map((p) => ({
  date: p.date.slice(5),
  disputes: p.disputes,
  won: p.won,
  autoResolved: p.autoResolved,
  fraudBlocked: p.fraudBlocked,
}));

export function AnalyticsView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Metric Analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Model performance benchmarks, precision/recall analysis, and cost-impact metrics
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <BenchmarkCard label="Precision" value="91.2%" target="85%" icon={Target} accent="success" delay={0} />
        <BenchmarkCard label="Recall" value="87.5%" target="80%" icon={Crosshair} accent="primary" delay={0.08} />
        <BenchmarkCard label="F1-Score" value="89.3%" target="82%" icon={Gauge} accent="success" delay={0.16} />
        <BenchmarkCard label="False Positive Rate" value="3.2%" target="<5%" icon={Percent} accent="warning" delay={0.24} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm"
        >
          <h3 className="mb-4 text-sm font-semibold text-foreground">Model Performance vs Target</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={benchmarkData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
              <Radar name="Actual" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
              <Radar name="Target" dataKey="target" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.15} strokeWidth={1.5} strokeDasharray="4 4" />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm"
        >
          <h3 className="mb-4 text-sm font-semibold text-foreground">Cost Impact Analysis</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={costAnalysis} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
              />
              <YAxis
                type="category"
                dataKey="category"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                width={140}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`}
              />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {costAnalysis.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">14-Day Dispute Resolution Breakdown</h3>
          <div className="flex gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary" /> Disputes</span>
            <span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-success" /> Won</span>
            <span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-warning" /> Auto-Resolved</span>
            <span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-destructive" /> Fraud Blocked</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={radarData}>
            <defs>
              <linearGradient id="colorDisputes2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Line type="monotone" dataKey="disputes" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            <Bar dataKey="won" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} barSize={8} />
            <Bar dataKey="autoResolved" fill="hsl(var(--warning))" radius={[3, 3, 0, 0]} barSize={8} />
            <Bar dataKey="fraudBlocked" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} barSize={8} />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52 }}
          className="rounded-xl border border-border bg-card/50 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <IndianRupee className="h-4 w-4 text-success" />
            <h3 className="text-sm font-semibold text-foreground">Net Savings</h3>
          </div>
          <p className="text-3xl font-bold text-success">₹28.45L</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Total fraud prevented minus false positive cost</p>
          <div className="mt-4 flex items-center gap-1.5">
            <TrendingDown className="h-3 w-3 text-success" />
            <span className="text-[11px] text-success">↑ 22% vs prior month</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl border border-border bg-card/50 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Avg Response Time</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">{mockMetrics.avgResponseTime}ms</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Guardrail evaluation latency (p50)</p>
          <div className="mt-4 flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">p95: 680ms · p99: 1.2s</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.68 }}
          className="rounded-xl border border-border bg-card/50 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-semibold text-foreground">False Positive Cost</h3>
          </div>
          <p className="text-3xl font-bold text-warning">₹0.85L</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Revenue impact from incorrectly flagged transactions</p>
          <div className="mt-4 flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">3.2% FPR · below 5% threshold</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


