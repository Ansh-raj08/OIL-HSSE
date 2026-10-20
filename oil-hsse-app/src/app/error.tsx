'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Root Error Boundary Component (Next.js App Router)
// Provides resilient recovery without tearing down the entire app
// ============================================================

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[RootErrorBoundary] Uncaught application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-app-page text-app-primary flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-app-surface border border-app-subtle shadow-2xl text-center space-y-5">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-app-primary tracking-tight">
            Operational Service Interruption
          </h2>
          <p className="text-xs text-app-secondary mt-1.5 leading-relaxed">
            The decision-support interface encountered an unexpected state. Other upstream systems and surveillance pipelines remain unaffected.
          </p>
        </div>

        {error.digest && (
          <div className="p-2.5 rounded-lg bg-app-elevated border border-app-subtle text-[11px] font-mono text-app-muted truncate">
            Error Ref: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto min-h-[40px] px-5 py-2 rounded-full bg-[#0066CC] hover:bg-[#0077ED] dark:bg-[#2997FF] dark:hover:bg-[#40A4FF] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Operation</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto min-h-[40px] px-5 py-2 rounded-full border border-app-strong hover:bg-app-hover text-app-primary text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
