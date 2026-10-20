'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Escalation Likelihood Indicator Component (SIH26165)
//
// Honest framing: Deterministic, rule-based heuristic indicator.
// NOT a statistical probability or machine learning prediction.
// ============================================================

import React from 'react';
import { EscalationLikelihood, EscalationTier } from '@/types/safety';
import { TrendingUp, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

interface EscalationLikelihoodGaugeProps {
  data?: EscalationLikelihood;
  compact?: boolean;
  className?: string;
}

export function getEscalationColor(tier: EscalationTier) {
  switch (tier) {
    case 'SEVERE':
      return {
        text: 'text-rose-700 dark:text-rose-400',
        bg: 'bg-rose-50 dark:bg-rose-950/60',
        border: 'border-rose-300 dark:border-rose-800/60',
        bar: 'bg-gradient-to-r from-red-600 to-rose-500',
        glow: 'shadow-[0_0_10px_rgba(244,63,94,0.3)]',
      };
    case 'HIGH':
      return {
        text: 'text-amber-700 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/60',
        border: 'border-amber-300 dark:border-amber-800/60',
        bar: 'bg-gradient-to-r from-amber-600 to-orange-500',
        glow: 'shadow-[0_0_10px_rgba(245,158,11,0.25)]',
      };
    case 'MODERATE':
      return {
        text: 'text-yellow-700 dark:text-yellow-400',
        bg: 'bg-yellow-50 dark:bg-yellow-950/50',
        border: 'border-yellow-300 dark:border-yellow-800/50',
        bar: 'bg-gradient-to-r from-yellow-600 to-amber-400',
        glow: 'shadow-[0_0_10px_rgba(234,179,8,0.2)]',
      };
    case 'LOW':
    default:
      return {
        text: 'text-emerald-700 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/50',
        border: 'border-emerald-300 dark:border-emerald-800/50',
        bar: 'bg-gradient-to-r from-emerald-600 to-teal-400',
        glow: 'shadow-[0_0_10px_rgba(16,185,129,0.2)]',
      };
  }
}

export default function EscalationLikelihoodGauge({
  data,
  compact = false,
  className = '',
}: EscalationLikelihoodGaugeProps) {
  if (!data) return null;

  const { score, tier, factors } = data;
  const colors = getEscalationColor(tier);

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-mono ${colors.bg} ${colors.border} ${className}`}
        title={`Escalation Likelihood: ${tier} (${score}/100). Rule-based heuristic indicator, not a statistical prediction.`}
      >
        <div className="flex items-center gap-1.5">
          <TrendingUp className={`w-3.5 h-3.5 ${colors.text} shrink-0`} />
          <span className="text-[10px] text-app-muted uppercase tracking-wider font-sans font-semibold">
            Escalation:
          </span>
          <span className={`text-[11px] font-bold ${colors.text}`}>{tier}</span>
        </div>

        {/* Small bounded meter bar */}
        <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border border-slate-300 dark:border-slate-700/60 hidden sm:block">
          <div
            className={`h-full rounded-full ${colors.bar}`}
            style={{ width: `${Math.min(100, Math.max(8, score))}%` }}
          />
        </div>

        <span className="text-[10px] text-app-secondary font-semibold tabular-nums">
          {score}/100
        </span>
      </div>
    );
  }

  // Full Explainable Card View (for ExplainabilityConsole)
  return (
    <div
      className={`rounded-xl border border-app-subtle bg-app-elevated/40 p-4 space-y-3.5 ${className}`}
    >
      {/* Header with bounded gauge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-app-elevated border border-app-subtle text-amber-700 dark:text-[#D4AF37]">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-sans font-semibold text-app-primary tracking-wide flex items-center gap-2">
              <span>ESCALATION LIKELIHOOD INDICATOR</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${colors.bg} ${colors.text} ${colors.border}`}
              >
                {tier}
              </span>
            </h4>
            <p className="text-[11px] font-sans text-app-muted">
              Deterministic heuristic evaluation of compound incident severity trajectory
            </p>
          </div>
        </div>

        {/* Bounded Heuristic Meter */}
        <div className="flex items-center gap-3 bg-app-surface px-3 py-1.5 rounded-lg border border-app-subtle shadow-xs">
          <div className="text-right">
            <div className="text-[10px] font-mono text-app-muted uppercase tracking-wider">
              Heuristic Score
            </div>
            <div className="text-base font-mono font-bold text-app-primary tabular-nums">
              <span className={colors.text}>{score}</span>
              <span className="text-app-muted text-xs font-normal"> / 100</span>
            </div>
          </div>
          <div className="w-20 sm:w-28 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border border-slate-300 dark:border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
              style={{ width: `${Math.min(100, Math.max(8, score))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Honest Framing Disclaimer Pill */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-app-surface border border-app-subtle text-[11px] font-sans text-app-muted">
        <Info className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37] shrink-0" />
        <span>
          <strong className="text-app-primary">Rule-Based Signal:</strong> This score represents deterministic rule-based heuristic compounding, not a statistical prediction or probability.
        </span>
      </div>

      {/* Breakdown of Deterministic Factors */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono text-app-muted uppercase tracking-wider">
          Contributing Operational Factors ({factors.length})
        </div>
        <div className="grid grid-cols-1 gap-2">
          {factors.map((f, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-app-surface border border-app-subtle text-xs font-sans shadow-xs"
            >
              <div className="flex items-start gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-[#D4AF37] mt-1.5 shrink-0" />
                <div>
                  <span className="font-semibold text-app-primary font-sans block">
                    {f.factor}
                  </span>
                  <span className="text-[11px] text-app-muted font-sans leading-relaxed">
                    {f.description}
                  </span>
                </div>
              </div>
              <span
                className={`font-mono text-xs font-bold shrink-0 px-2 py-0.5 rounded border ${
                  f.weight > 0
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800/40'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/40'
                }`}
              >
                {f.weight > 0 ? `+${f.weight}` : f.weight}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
