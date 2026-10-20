'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Global HSSE KPI Ribbon (UI/UX Revamp - Section 3)
// ============================================================

import React, { useRef } from 'react';
import { useSafety } from '@/context/SafetyContext';
import { useGsapKpiUpdate } from '@/hooks/useGsap';
import { KpiRibbonSkeleton } from '@/components/ui/Skeleton';
import {
  FileText,
  AlertTriangle,
  Clock3,
  ShieldCheck,
} from 'lucide-react';

export default function KpiRibbon() {
  const { kpiMetrics, setFilter, filter, isLoading } = useSafety();
  const { totalIngested, flaggedSif, pendingReview, complianceRate } = kpiMetrics;

  // GSAP — animate KPI values only on genuine data changes
  const kpi1Ref = useRef<HTMLDivElement>(null);
  const kpi2Ref = useRef<HTMLDivElement>(null);
  const kpi3Ref = useRef<HTMLDivElement>(null);
  useGsapKpiUpdate(kpi1Ref as React.RefObject<HTMLElement | null>, totalIngested, '[data-kpi-value]');
  useGsapKpiUpdate(kpi2Ref as React.RefObject<HTMLElement | null>, flaggedSif, '[data-kpi-value]');
  useGsapKpiUpdate(kpi3Ref as React.RefObject<HTMLElement | null>, pendingReview, '[data-kpi-value]');

  if (isLoading) {
    return <KpiRibbonSkeleton />;
  }

  return (

    <section className="max-w-[1720px] w-full mx-auto px-4 lg:px-6 pt-4 pb-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 01: Total Ingested Reports */}
        <div
          ref={kpi1Ref}
          onClick={() => setFilter('ALL')}
          className={`cursor-pointer rounded-xl border p-4 transition-all shadow-xs ${
            filter === 'ALL'
              ? 'bg-app-elevated border-[#0066CC] ring-1 ring-[#0066CC]/30 dark:border-[#2997FF] dark:ring-[#2997FF]/30'
              : 'border-app-subtle bg-app-surface hover:border-app-strong hover:bg-app-elevated/50'
          }`}
        >
          <div className="flex items-center justify-between text-app-muted text-xs mb-2">
            <span className="font-sans font-semibold text-xs uppercase tracking-wider text-app-secondary">
              Total Ingested Reports
            </span>
            <FileText className="w-4 h-4 text-app-muted" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold font-mono text-app-primary tracking-tight tabular-nums">
              <span data-kpi-value>{totalIngested}</span>
            </span>
            <span className="text-xs text-app-muted font-sans">records</span>
          </div>
          <p className="mt-2 text-xs text-app-muted font-sans truncate">
            {totalIngested === 0 ? 'No incidents in database' : 'Scanned across active E&P fields'}
          </p>
        </div>

        {/* KPI 02: Flagged SIF Precursors */}
        <div
          ref={kpi2Ref}
          onClick={() => setFilter('CRITICAL')}
          className={`cursor-pointer rounded-xl border p-4 transition-all shadow-xs ${
            filter === 'CRITICAL'
              ? 'bg-red-500/10 border-red-500 ring-1 ring-red-500/30'
              : 'border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 hover:border-red-400 dark:hover:border-red-700/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-sans font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 text-red-700 dark:text-red-300">
              <span className={`w-2 h-2 rounded-full ${flaggedSif > 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
              Flagged SIF Precursors
            </span>
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold font-mono text-red-600 dark:text-red-400 tracking-tight tabular-nums">
              <span data-kpi-value>{flaggedSif}</span>
            </span>
            <span className="text-xs font-sans text-red-700 dark:text-red-300 font-semibold uppercase tracking-wider">
              High Energy
            </span>
          </div>
          <p className="mt-2 text-xs text-red-600/80 dark:text-red-300/80 font-sans truncate">
            {totalIngested === 0 ? 'No active SIF flags' : 'Life-threatening potential requiring stop-work'}
          </p>
        </div>

        {/* KPI 03: Pending Officer Review */}
        <div
          ref={kpi3Ref}
          onClick={() => setFilter('PENDING REVIEW')}
          className={`cursor-pointer rounded-xl border p-4 transition-all shadow-xs ${
            filter === 'PENDING REVIEW'
              ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/30'
              : 'border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-400 dark:hover:border-amber-700/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-sans font-semibold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Pending Officer Review
            </span>
            <Clock3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold font-mono text-amber-600 dark:text-amber-400 tracking-tight tabular-nums">
              <span data-kpi-value>{pendingReview}</span>
            </span>
            <span className="text-xs font-sans text-amber-700 dark:text-amber-300 font-semibold uppercase tracking-wider">
              HITL Queue
            </span>
          </div>
          <p className="mt-2 text-xs text-amber-600/80 dark:text-amber-300/80 font-sans truncate">
            {totalIngested === 0 ? 'No items pending review' : 'Awaiting superintendent sign-off'}
          </p>
        </div>

        {/* KPI 04: Human Compliance Rate */}
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-sans font-semibold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Compliance / Validation
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">
              {totalIngested === 0 ? '--' : `${complianceRate}%`}
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400/80 font-sans">
              {totalIngested === 0 ? 'no records' : 'verified'}
            </span>
          </div>
          <div className="mt-3 w-full bg-emerald-200/50 dark:bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalIngested === 0 ? 0 : complianceRate}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
