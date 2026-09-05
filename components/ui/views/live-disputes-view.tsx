'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Scale,
  Clock,
  IndianRupee,
  ShieldAlert,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  mockDisputes,
  reasonLabels,
  statusConfig,
  riskLevelConfig,
  formatFullCurrency,
} from '@/lib/mock-data';
import type { Dispute, DisputeStatus, RiskLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

export function LiveDisputesView() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [selected, setSelected] = useState<Dispute | null>(null);

  const filtered = useMemo(() => {
    return mockDisputes.filter((d) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !d.id.toLowerCase().includes(q) &&
          !d.transaction.merchantName.toLowerCase().includes(q) &&
          !d.transaction.customerName.toLowerCase().includes(q) &&
          !d.transaction.customerEmail.toLowerCase().includes(q)
        )
          return false;
      }
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (riskFilter !== 'all' && d.riskLevel !== riskFilter) return false;
      return true;
    });
  }, [search, statusFilter, riskFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Live Disputes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered.length} disputes · {mockDisputes.filter((d) => d.status === 'open').length} open · {mockDisputes.filter((d) => d.status === 'auto_resolved').length} auto-resolved
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by dispute ID, merchant, or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DisputeStatus | 'all')}
          className="rounded-lg border border-border bg-card/50 px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
          <option value="auto_resolved">Auto-Resolved</option>
        </select>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value as RiskLevel | 'all')}
          className="rounded-lg border border-border bg-card/50 px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="all">All Risk Levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Dispute</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Merchant</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reason</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Risk</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Confidence</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <motion.tr
                  key={d.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelected(d)}
                  className="cursor-pointer border-b border-border/40 transition-colors hover:bg-secondary/20"
                >
                  <td className="px-4 py-3">
                    <p className="text-[12px] font-medium text-foreground">{d.id}</p>
                    <p className="text-[10px] text-muted-foreground">{d.transaction.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[12px] text-foreground">{d.transaction.merchantName}</p>
                    <p className="text-[10px] text-muted-foreground">{d.transaction.customerName}</p>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-foreground">{reasonLabels[d.reason]}</td>
                  <td className="px-4 py-3 text-[12px] font-semibold text-foreground">{formatFullCurrency(d.chargebackAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-md px-2 py-1 text-[10px] font-medium', riskLevelConfig[d.riskLevel].bg, riskLevelConfig[d.riskLevel].text)}>
                      {riskLevelConfig[d.riskLevel].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', d.confidenceScore >= 80 ? 'bg-success' : d.confidenceScore >= 70 ? 'bg-warning' : 'bg-destructive')}
                          style={{ width: `${d.confidenceScore}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-medium tabular-nums text-foreground">{d.confidenceScore}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-md px-2 py-1 text-[10px] font-medium', statusConfig[d.status].bg, statusConfig[d.status].text)}>
                      {statusConfig[d.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No disputes match the current filters.
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && <DisputeDetailDrawer dispute={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

function DisputeDetailDrawer({ dispute, onClose }: { dispute: Dispute; onClose: () => void }) {
  const tx = dispute.transaction;
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 z-50 h-screen w-full max-w-lg overflow-y-auto border-l border-border bg-card scrollbar-thin"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card/80 px-6 py-4 backdrop-blur">
          <div>
            <h3 className="text-base font-bold text-foreground">{dispute.id}</h3>
            <p className="text-[11px] text-muted-foreground">{reasonLabels[dispute.reason]}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid grid-cols-2 gap-3">
            <DetailBox label="Chargeback Amount" value={formatFullCurrency(dispute.chargebackAmount)} icon={IndianRupee} />
            <DetailBox label="Confidence Score" value={`${dispute.confidenceScore}%`} icon={ShieldAlert} />
            <DetailBox label="Filed Date" value={new Date(dispute.filedDate).toLocaleDateString('en-IN')} icon={Clock} />
            <DetailBox label="Response Deadline" value={new Date(dispute.responseDeadline).toLocaleDateString('en-IN')} icon={Clock} />
          </div>

          <div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</h4>
            <p className="text-[13px] leading-relaxed text-foreground/90 rounded-lg bg-secondary/30 p-3">{dispute.description}</p>
          </div>

          <div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Guardrail Flags</h4>
            <div className="flex flex-wrap gap-2">
              {dispute.guardrailFlags.length > 0 ? (
                dispute.guardrailFlags.map((flag, i) => (
                  <span key={i} className="rounded-md bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning">
                    {flag}
                  </span>
                ))
              ) : (
                <span className="text-[12px] text-muted-foreground">No flags triggered</span>
              )}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Transaction Metadata</h4>
            <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-2">
              <DetailRow label="Transaction ID" value={tx.id} />
              <DetailRow label="Merchant" value={`${tx.merchantName} (${tx.merchantId})`} />
              <DetailRow label="Customer" value={`${tx.customerName} (${tx.customerEmail})`} />
              <DetailRow label="Payment Method" value={`${tx.cardBrand} ****${tx.cardLast4} (${tx.paymentMethod})`} />
              <DetailRow label="IP Address" value={tx.ipAddress} />
              <DetailRow label="Billing Country" value={tx.billingCountry} />
              <DetailRow label="Shipping Country" value={tx.shippingCountry} />
              <DetailRow label="AVS Result" value={tx.avsResult} />
              <DetailRow label="CVV Result" value={tx.cvvResult} />
              <DetailRow label="3D Secure" value={tx.is3DSecure ? 'Verified' : 'Not Verified'} />
              <DetailRow label="Prior Orders" value={`${tx.purchaseHistory.priorOrders} orders (avg ₹${tx.purchaseHistory.avgOrderValue})`} />
              <DetailRow label="Device Fingerprint" value={tx.deviceFingerprint} />
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 glow-primary">
              Generate Evidence
            </button>
            <button className="flex-1 rounded-lg border border-border bg-secondary/30 px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-secondary/50">
              Escalate to Human
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function DetailBox({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Clock }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/20 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 text-[13px] font-semibold text-foreground">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-[11px] font-medium text-foreground">{value}</span>
    </div>
  );
}
