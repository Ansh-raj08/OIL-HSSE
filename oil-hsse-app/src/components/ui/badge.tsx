// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Shared UI Primitives: Calibrated Risk Badges & Category Tags
// (Master Prompt UI/UX Revamp - Section 3)
// ============================================================

import React from 'react';
import type { RiskLevel, ValidationStatus, IncidentCategory } from '@/types/safety';
import {
  SEVERITY_ICONS,
  STATUS_ICONS,
  CATEGORY_ICONS,
  ROLE_ICONS,
  SeverityIcon,
  StatusIcon,
  CategoryIcon,
  RoleIcon,
} from '@/components/ui/iconMap';
import { AlertTriangle } from 'lucide-react';

export {
  SEVERITY_ICONS,
  STATUS_ICONS,
  CATEGORY_ICONS,
  ROLE_ICONS,
  SeverityIcon,
  StatusIcon,
  CategoryIcon,
  RoleIcon,
};

// ── 1. Severity & Score Calibrated Badge ────────────────────────
interface RiskBadgeProps {
  level: RiskLevel;
  score: number;
  className?: string;
  size?: 'sm' | 'md';
}

export function RiskBadge({ level, score, className = '', size = 'md' }: RiskBadgeProps) {
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  const FlameIcon = SEVERITY_ICONS.CRITICAL;
  const AlertIcon = SEVERITY_ICONS.HIGH;
  const MediumIcon = SEVERITY_ICONS.MEDIUM;
  const LowIcon = SEVERITY_ICONS.LOW;

  if (level === 'CRITICAL') {
    // Gradation: 90+ is saturated solid crimson; 80-89 is outlined burgundy
    if (score >= 90) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded ${padding} font-sans font-semibold bg-red-600 text-white border border-red-500 shadow-sm ${className}`}
        >
          <FlameIcon className="w-3.5 h-3.5 text-white flex-shrink-0 animate-pulse" />
          <span>CRITICAL</span>
          <span className="font-mono opacity-90">[{score}/100]</span>
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded ${padding} font-sans font-semibold bg-red-50 text-red-700 border border-red-300 dark:bg-red-950/80 dark:text-red-300 dark:border-red-700/60 ${className}`}
      >
        <AlertIcon className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
        <span>CRITICAL</span>
        <span className="font-mono text-red-600 dark:text-red-400">[{score}/100]</span>
      </span>
    );
  }

  if (level === 'HIGH') {
    // Gradation: 70+ is saturated amber; 60-69 is outlined amber
    if (score >= 70) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded ${padding} font-sans font-semibold bg-amber-500 text-slate-950 border border-amber-400 shadow-sm dark:bg-amber-600 dark:text-slate-950 ${className}`}
        >
          <AlertIcon className="w-3.5 h-3.5 text-slate-950 flex-shrink-0" />
          <span>HIGH</span>
          <span className="font-mono text-slate-950/90 font-semibold">[{score}/100]</span>
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded ${padding} font-sans font-semibold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700/60 ${className}`}
      >
        <AlertIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <span>HIGH</span>
        <span className="font-mono text-amber-600 dark:text-amber-400">[{score}/100]</span>
      </span>
    );
  }

  if (level === 'MEDIUM') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded ${padding} font-sans font-semibold bg-yellow-50 text-yellow-800 border border-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-700/40 ${className}`}
      >
        <MediumIcon className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
        <span>MEDIUM</span>
        <span className="font-mono text-yellow-600 dark:text-yellow-400">[{score}/100]</span>
      </span>
    );
  }

  // LOW
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded ${padding} font-sans font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/40 ${className}`}
    >
      <LowIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
      <span>LOW</span>
      <span className="font-mono text-emerald-600 dark:text-emerald-400">[{score}/100]</span>
    </span>
  );
}

// ── 2. Plain-Text Category & LSR Tags (NO heavy borders) ─────────
interface IncidentMetadataProps {
  lsrTitle?: string;
  category: IncidentCategory;
  className?: string;
}

export function IncidentMetadata({ lsrTitle, category, className = '' }: IncidentMetadataProps) {
  const categoryLabel = category.replace('_', ' ');

  const categoryColor =
    category === 'UNSAFE_ACT'
      ? 'text-orange-600 dark:text-orange-400'
      : category === 'NEAR_MISS'
      ? 'text-blue-600 dark:text-blue-400'
      : 'text-amber-600 dark:text-amber-400';

  return (
    <div className={`flex items-center gap-2 text-xs font-sans ${className}`}>
      {lsrTitle && (
        <span className="font-semibold text-amber-700 dark:text-[#D4AF37] tracking-tight">
          {lsrTitle}
        </span>
      )}
      {lsrTitle && <span className="text-slate-400 dark:text-slate-600">•</span>}
      <span className={`uppercase font-semibold tracking-wider text-[11px] ${categoryColor}`}>
        {categoryLabel}
      </span>
    </div>
  );
}

// ── 3. Human-in-the-Loop Validation Status ─────────────────────
interface StatusChipProps {
  status: ValidationStatus;
  className?: string;
  isActionable?: boolean;
}

export function StatusChip({ status, className = '', isActionable = false }: StatusChipProps) {
  const PendingIcon = STATUS_ICONS.PENDING;
  const ConfirmedIcon = STATUS_ICONS.CONFIRMED;
  const OverriddenIcon = STATUS_ICONS.OVERRIDDEN;

  switch (status) {
    case 'PENDING':
      return (
        <span
          className={`inline-flex items-center gap-1 text-xs font-sans font-semibold text-amber-700 dark:text-amber-400 ${
            isActionable
              ? 'px-2 py-0.5 rounded bg-amber-50 border border-amber-300 dark:bg-amber-950/60 dark:border-amber-800/50'
              : ''
          } ${className}`}
        >
          <PendingIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span>Pending Review</span>
        </span>
      );
    case 'CONFIRMED':
      return (
        <span
          className={`inline-flex items-center gap-1 text-xs font-sans font-semibold text-emerald-700 dark:text-emerald-400 ${
            isActionable
              ? 'px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800/50'
              : ''
          } ${className}`}
        >
          <ConfirmedIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>Confirmed SIF</span>
        </span>
      );
    case 'OVERRIDDEN':
      return (
        <span
          className={`inline-flex items-center gap-1 text-xs font-sans font-semibold text-slate-600 dark:text-slate-400 ${
            isActionable
              ? 'px-2 py-0.5 rounded bg-slate-100 border border-slate-300 dark:bg-slate-800/80 dark:border-slate-700'
              : ''
          } ${className}`}
        >
          <OverriddenIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
          <span>Overridden</span>
        </span>
      );
  }
}
