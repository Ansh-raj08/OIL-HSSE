'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Custom 404 Route: Unmapped Operational Route
// ============================================================

import React from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { AlertTriangle, ArrowLeft, Activity, BookOpen, Database } from 'lucide-react';

export default function NotFound() {
  return (
    <AppShell
      breadcrumbs={[
        { label: 'System', href: '/dashboard' },
        { label: '404 - Route Unmapped' },
      ]}
    >
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#0066CC] dark:text-[#2997FF] mb-5 shadow-2xs">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <span className="font-mono text-xs uppercase tracking-widest text-[#0066CC] dark:text-[#2997FF] font-semibold mb-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
          HTTP 404 · Unmapped Operational Route
        </span>

        <h1 className="text-2xl sm:text-3xl font-bold text-app-primary tracking-tight font-sans mt-2 mb-3">
          Telemetry Sector Not Found
        </h1>

        <p className="max-w-md text-sm text-app-secondary leading-relaxed font-sans mb-8">
          The requested URL does not correspond to an active operational module, surveillance register, or governance registry within the Oil India Limited HSSE Platform.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0066CC] hover:bg-[#0077ED] text-white text-xs font-medium font-sans shadow-xs transition-all active:scale-[0.99]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Triage Console</span>
          </Link>

          <Link
            href="/analytics"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-app-subtle bg-app-surface hover:bg-app-hover text-app-primary text-xs font-medium font-sans transition-all active:scale-[0.99]"
          >
            <Activity className="w-4 h-4 text-[#0066CC] dark:text-[#2997FF]" />
            <span>Operational Analytics</span>
          </Link>

          <Link
            href="/guidelines"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-app-subtle bg-app-surface hover:bg-app-hover text-app-primary text-xs font-medium font-sans transition-all active:scale-[0.99]"
          >
            <BookOpen className="w-4 h-4 text-app-muted" />
            <span>IOGP Guidelines</span>
          </Link>
        </div>

        <div className="mt-12 pt-6 border-t border-app-subtle max-w-sm w-full text-center">
          <span className="text-[11px] font-mono text-app-muted">
            Assam Basin Operations · Statutory Code OISD-105 · SIH26165
          </span>
        </div>
      </div>
    </AppShell>
  );
}
