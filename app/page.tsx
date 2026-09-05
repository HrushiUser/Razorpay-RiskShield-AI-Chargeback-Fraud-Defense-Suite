'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, ChevronDown, Shield } from 'lucide-react';
import { Sidebar, ViewKey } from '@/components/sidebar';
import { DashboardView } from '@/components/views/dashboard-view';
import { LiveDisputesView } from '@/components/views/live-disputes-view';
import { ExtractionView } from '@/components/views/extraction-view';
import { GuardrailLogsView } from '@/components/views/guardrail-logs-view';
import { AnalyticsView } from '@/components/views/analytics-view';

export default function Home() {
  const [activeView, setActiveView] = useState<ViewKey>('dashboard');

  return (
    <div className="flex h-screen overflow-hidden bg-background bg-radial-glow">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border bg-card/30 px-6 py-3.5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-[13px] font-semibold text-foreground">
                Razorpay RiskShield AI
              </span>
            </div>
            <span className="rounded-md bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
              Live
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search disputes, transactions..."
                className="w-64 rounded-lg border border-border bg-secondary/30 py-2 pl-9 pr-3 text-[12px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary/30 hover:text-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/20 px-3 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                RM
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-medium text-foreground">Risk Manager</p>
                <p className="text-[9px] text-muted-foreground">Admin</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {activeView === 'dashboard' && <DashboardView />}
              {activeView === 'disputes' && <LiveDisputesView />}
              {activeView === 'extraction' && <ExtractionView />}
              {activeView === 'guardrails' && <GuardrailLogsView />}
              {activeView === 'analytics' && <AnalyticsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
