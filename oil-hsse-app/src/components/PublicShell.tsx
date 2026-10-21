'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Reusable PublicShell Component (Section 2 - Master Prompt)
// Shared visual system for both Landing (/) and Login (/login)
// Grid background, dual radial glow layers, spotlight, header & footer.
// Zero hardcoded colors; reads purely from CSS tokens.
// ============================================================

import React from 'react';
import Link from 'next/link';
import { Spotlight } from '@/components/ui/spotlight-new';
import { FULL_VERSION_STRING } from '@/config/version';

export interface PublicShellProps {
  children: React.ReactNode;
  mode?: 'landing' | 'login';
  headerRight?: React.ReactNode;
}

export function PublicShell({ children, mode = 'landing', headerRight }: PublicShellProps) {
  return (
    <div className="dark bg-black text-white relative min-h-dvh w-full flex flex-col justify-between overflow-x-clip selection:bg-[#0066CC]/30 selection:text-white font-sans">
      <div className="relative flex min-h-dvh w-full flex-col justify-between overflow-hidden bg-black bg-public-grid">
        {/* ── Deep Atmospheric Ambient Glow (Behind content: z-0) ──── */}
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-public-glow-1"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-public-glow-2"
          aria-hidden="true"
        />

        {/* ── Ambient Spotlight Beam Animation (Behind content: z-0) ─ */}
        <Spotlight
          gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, var(--public-spot-1) 0%, var(--public-spot-2) 50%, transparent 80%)"
          gradientSecond="radial-gradient(50% 50% at 50% 50%, var(--public-spot-1) 0%, var(--public-spot-2) 80%, transparent 100%)"
          gradientThird="radial-gradient(50% 50% at 50% 50%, var(--public-spot-2) 0%, var(--public-spot-3) 80%, transparent 100%)"
        />

        {/* ── Public Top Header ───────────────────────────────────── */}
        <header className="relative top-0 left-0 right-0 z-20 w-full max-w-7xl mx-auto flex items-center justify-between px-6 py-5 sm:px-10">
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-lg transition-opacity hover:opacity-90"
            title="OIL HSSE Decision-Support Platform"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 backdrop-blur-md transition-transform group-hover:scale-105">
              <span className="font-mono text-xs font-semibold text-neutral-300">OIL</span>
            </div>
            <span className="text-xs font-medium tracking-wider text-neutral-400 uppercase">
              HSSE Enterprise
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            {headerRight ? (
              headerRight
            ) : mode === 'landing' ? (
              <Link
                href="/login"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-neutral-300 backdrop-blur-md transition hover:border-white/20 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                Sign In
              </Link>
            ) : (
              <Link
                href="/"
                className="text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors focus-visible:outline-none focus-visible:underline"
              >
                Back to home
              </Link>
            )}
          </nav>
        </header>

        {/* ── Main Dynamic Page Content ───────────────────────────── */}
        <main
          className={`relative z-10 w-full flex-1 flex flex-col items-center px-4 ${
            mode === 'login' ? 'justify-start pt-6 sm:pt-12 pb-12' : 'justify-center py-8 sm:py-12'
          }`}
        >
          {children}
        </main>

        {/* ── Public Quiet Footer Line ────────────────────────────── */}
        <footer className="relative bottom-0 z-10 w-full max-w-7xl mx-auto px-6 py-5 text-center text-[11px] font-mono tracking-widest text-neutral-500 uppercase">
          © {new Date().getFullYear()} OIL INDIA LIMITED • THΞ ΛRPΛNΞT • SIH26165 • {FULL_VERSION_STRING}
        </footer>
      </div>
    </div>
  );
}

export default PublicShell;
