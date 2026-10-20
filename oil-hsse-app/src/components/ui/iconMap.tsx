// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Shared UI Icon Map (Lucide SVG Icons - Master Prompt Section 2)
// Centralized mapping for all status, severity, category, and role icons
// ============================================================

import React from 'react';
import type { RiskLevel, ValidationStatus, IncidentCategory, UserRole } from '@/types/safety';
import {
  Flame,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  XCircle,
  SlidersHorizontal,
  ArrowUpRight,
  ShieldCheck,
  User,
  Zap,
  Activity,
  Layers,
  type LucideIcon,
} from 'lucide-react';

// ── 1. Severity Icons ──────────────────────────────────────────
export const SEVERITY_ICONS: Record<RiskLevel, LucideIcon> = {
  CRITICAL: Flame,
  HIGH: AlertTriangle,
  MEDIUM: ShieldAlert,
  LOW: CheckCircle2,
};

// ── 2. Validation / Review Status Icons ─────────────────────────
export type ExtendedStatus = ValidationStatus | 'PENDING_REVIEW' | 'CONFIRMED_SIF' | 'ESCALATED';

export const STATUS_ICONS: Record<ExtendedStatus, LucideIcon> = {
  PENDING: AlertCircle,
  PENDING_REVIEW: AlertCircle,
  CONFIRMED: CheckCircle2,
  CONFIRMED_SIF: CheckCircle2,
  ESCALATED: ArrowUpRight,
  OVERRIDDEN: XCircle,
};

// ── 3. Incident Category Icons ────────────────────────────────
export const CATEGORY_ICONS: Record<IncidentCategory, LucideIcon> = {
  UNSAFE_ACT: Zap,
  UNSAFE_CONDITION: AlertTriangle,
  NEAR_MISS: Activity,
};

// ── 4. User Role Icons ─────────────────────────────────────────
export const ROLE_ICONS: Record<UserRole, LucideIcon> = {
  ADMIN: ShieldCheck,
  USER: User,
};

// ── 5. Helper Icon Components ──────────────────────────────────
interface IconProps {
  className?: string;
  size?: number;
}

export function SeverityIcon({ level, className = 'w-3.5 h-3.5' }: { level: RiskLevel; className?: string }) {
  const IconComponent = SEVERITY_ICONS[level] || AlertTriangle;
  return <IconComponent className={className} />;
}

export function StatusIcon({ status, className = 'w-3.5 h-3.5' }: { status: ExtendedStatus; className?: string }) {
  const IconComponent = STATUS_ICONS[status] || AlertCircle;
  return <IconComponent className={className} />;
}

export function CategoryIcon({ category, className = 'w-3.5 h-3.5' }: { category: IncidentCategory; className?: string }) {
  const IconComponent = CATEGORY_ICONS[category] || Activity;
  return <IconComponent className={className} />;
}

export function RoleIcon({ role, className = 'w-3.5 h-3.5' }: { role: UserRole; className?: string }) {
  const IconComponent = ROLE_ICONS[role] || User;
  return <IconComponent className={className} />;
}
