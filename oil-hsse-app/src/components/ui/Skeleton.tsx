'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Shared High-Density Enterprise Skeleton Loaders & Spinners (SIH26165)
//
// Design Guidelines:
// - Shaped placeholders matching final layout geometry (no generic centered spinners)
// - Subtle dark palette (slate/navy) that blends into #090D16 background
// - Respects prefers-reduced-motion via motion-reduce:animate-none
// - Does NOT visually compete with the green/emerald "INFERENCE ACTIVE" beacon
// ============================================================

import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Core primitive skeleton element with subtle pulse animation.
 * Automatically halts animation when prefers-reduced-motion is active.
 */
export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`bg-slate-200/80 dark:bg-slate-800/60 rounded-md animate-pulse motion-reduce:animate-none ${className}`}
      {...props}
    />
  );
}

/**
 * Compact inline spinner for button actions (e.g. "Deleting...", "Authenticating...").
 */
export function ButtonSpinner({
  className = 'w-4 h-4',
  color = 'currentColor',
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      className={`animate-spin motion-reduce:animate-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill={color}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Skeleton placeholder for the KPI Ribbon (4 cards).
 */
export function KpiRibbonSkeleton() {
  return (
    <section className="max-w-[1720px] w-full mx-auto px-4 lg:px-6 pt-4 pb-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-app-subtle bg-app-surface p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-4 w-4 rounded-sm" />
            </div>
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-44" />
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Skeleton placeholder for the Priority Triage Stream.
 * Renders 3 realistic card rows matching the exact layout of incident items.
 */
export function TriageStreamSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="p-3 sm:p-5 space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-3.5 sm:p-5 rounded-xl border border-app-subtle bg-app-surface space-y-3"
        >
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-4 w-5" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24 rounded-md hidden sm:block" />
            </div>
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>

          {/* Narrative Paragraph */}
          <div className="space-y-1.5 py-1">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
          </div>

          {/* Inline Reason & Explanation Strip */}
          <div className="p-2.5 sm:p-3 rounded-lg bg-app-elevated border border-app-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Skeleton className="h-6 w-48 rounded-md" />
              <Skeleton className="h-5 w-32 rounded hidden md:block" />
            </div>
            <Skeleton className="h-4 w-36 self-end sm:self-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton placeholder for the Datasets management page.
 */
export function DatasetsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left 2 Cols: Dataset List */}
      <div className="lg:col-span-2 space-y-3">
        <div className="bg-app-surface border border-app-subtle rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-app-subtle">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-app-subtle bg-app-elevated space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Col: Details Panel */}
      <div className="bg-app-surface border border-app-subtle rounded-2xl p-5 space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="space-y-2 pt-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for Analytics Charts.
 */
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-app-subtle bg-app-surface space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-2xl border border-app-subtle bg-app-surface space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
