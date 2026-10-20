'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// AI Chatbot Module (/chatbot)
// Interactive Safety Intelligence Assistant — Coming Soon
// ============================================================

import React from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import {
  Bot,
  Sparkles,
  ArrowRight,
  BookOpen,
  LayoutDashboard,
  ShieldCheck,
  Clock,
  Cpu,
} from 'lucide-react';

export default function ChatbotPage() {
  return (
    <AppShell
      title="AI Chatbot"
      subtitle="Intelligent Safety Assistant"
      breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'AI Chatbot' }]}
    >
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 min-h-[calc(100vh-120px)]">
        {/* ── Coming Soon Centered Card ─────────────────────────────── */}
        <div className="max-w-xl w-full rounded-2xl border border-app-subtle bg-app-surface p-8 sm:p-10 shadow-xl text-center flex flex-col items-center animate-fade-in">
          {/* Beacon / Icon */}
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#0066CC]/10 dark:bg-[#2997FF]/15 border border-[#0066CC]/20 dark:border-[#2997FF]/30 flex items-center justify-center text-[#0066CC] dark:text-[#2997FF] shadow-xs">
              <Bot className="w-8 h-8" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 mb-4 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Coming Soon</span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-semibold text-app-primary tracking-tight font-sans mb-3">
            AI Chatbot
          </h1>

          {/* Description */}
          <p className="text-sm text-app-secondary max-w-md leading-relaxed font-sans mb-8">
            The interactive conversational safety intelligence assistant is currently under development. It will provide real-time retrieval-augmented querying across IOGP 459 Life-Saving Rules, statutory OISD/DGMS frameworks, and upstream operational logs.
          </p>

          {/* Planned Features Preview Pill Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8 text-left">
            <div className="p-3 rounded-xl border border-app-subtle bg-app-elevated flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-[#0066CC] dark:text-[#2997FF] flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-app-primary block">
                  IOGP & OISD Regulatory QA
                </span>
                <span className="text-[11px] text-app-muted block mt-0.5">
                  Natural language answers grounded in safety standard clauses
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-app-subtle bg-app-elevated flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-app-primary block">
                  Incident Precursor Inquiry
                </span>
                <span className="text-[11px] text-app-muted block mt-0.5">
                  Search historical logs by equipment, site, or high-energy hazard
                </span>
              </div>
            </div>
          </div>

          {/* Action Links */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto min-h-[42px] px-5 py-2.5 rounded-full bg-[#0066CC] hover:bg-[#0077ED] dark:bg-[#2997FF] dark:hover:bg-[#40A4FF] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Return to Triage Stream</span>
            </Link>

            <Link
              href="/guidelines"
              className="w-full sm:w-auto min-h-[42px] px-5 py-2.5 rounded-full border border-app-strong hover:bg-app-hover text-app-primary text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-app-muted" />
              <span>Browse IOGP Guidelines</span>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
