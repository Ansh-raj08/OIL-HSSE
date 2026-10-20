'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Explainable AI (XAI) & Supervisory Decision Modal (Master Prompt Section 3)
// Full-featured decision workflow in a focused modal dialog
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGsapModalReveal, useGsapRiskScoreReveal } from '@/hooks/useGsap';
import { useSafety } from '@/context/SafetyContext';
import { useAuth } from '@/context/AuthContext';
import { useTimeFormat } from '@/context/TimeFormatContext';
import { useToast } from '@/context/ToastContext';
import { ControlLevel } from '@/types/safety';
import { RiskBadge, StatusChip } from '@/components/ui/badge';
import EscalationLikelihoodGauge from '@/components/EscalationLikelihoodGauge';
import {
  FileText,
  Zap,
  Layers,
  MapPin,
  Clock,
  User,
  AlertTriangle,
  SlidersHorizontal,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  X,
} from 'lucide-react';

interface ExplainabilityConsoleProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ExplainabilityConsole({ isOpen = true, onClose }: ExplainabilityConsoleProps) {
  const { selectedIncident, confirmAndEscalate, overrideIncident } = useSafety();
  const { session, canEscalate, role } = useAuth();
  const { formatTimestamp } = useTimeFormat();
  const toast = useToast();

  const [isMounted, setIsMounted] = useState(false);
  const [isOverrideFormOpen, setIsOverrideFormOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideOfficer, setOverrideOfficer] = useState(session?.name || 'Administrator');
  const [escalationNote, setEscalationNote] = useState('');
  const [showEscalationSuccess, setShowEscalationSuccess] = useState(false);
  const [isNarrativeExpanded, setIsNarrativeExpanded] = useState(false);

  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // GSAP motion — modal shell reveal
  const modalRef = useRef<HTMLDivElement>(null);
  useGsapModalReveal(modalRef as React.RefObject<HTMLElement | null>, !!(isOpen && selectedIncident));

  // GSAP motion — direct DOM ref to animate risk score without triggering React re-render storms
  const scoreSpanRef = useRef<HTMLSpanElement>(null);
  const targetScore = selectedIncident?.riskScore ?? 0;
  useGsapRiskScoreReveal(targetScore, !!(isOpen && selectedIncident), scoreSpanRef);

  useEffect(() => {
    if (session?.name) {
      setOverrideOfficer(session.name);
    }
  }, [session?.name]);

  // Focus trap & focus return
  useEffect(() => {
    if (isOpen && selectedIncident) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    } else if (!isOpen && previouslyFocusedRef.current) {
      previouslyFocusedRef.current.focus?.();
      previouslyFocusedRef.current = null;
    }
  }, [isOpen, selectedIncident]);

  // Handle escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isOverrideFormOpen) {
          setIsOverrideFormOpen(false);
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isOverrideFormOpen, onClose]);

  // Prevent background scrolling while modal is open without layout shift
  useEffect(() => {
    if (isOpen && selectedIncident) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen, selectedIncident]);

  if (!isOpen || !selectedIncident || !isMounted) {
    return null;
  }

  const {
    id,
    site,
    timestamp,
    reportedBy,
    category,
    rawNarrative,
    riskScore,
    riskLevel,
    isSifPrecursor,
    lsrTitle,
    lsrViolations,
    xaiTriggers,
    hierarchyActions,
    validationStatus,
    reviewedBy,
    reviewedAt,
    overrideJustification,
    escalationNotes,
  } = selectedIncident;

  const handleConfirm = () => {
    confirmAndEscalate(
      id,
      session?.name || 'Administrator (Chief HSSE Supt.)',
      escalationNote ||
        'High-energy SIF Precursor confirmed by Safety Superintendent. Stop-work advisory dispatched to Rig Floor.'
    );
    setShowEscalationSuccess(true);
    toast.success(
      `Incident ${id} Confirmed`,
      'Verified as SIF Precursor. Emergency stop-work advisory logged and dispatched to Rig Floor.'
    );
    setTimeout(() => setShowEscalationSuccess(false), 4000);
  };

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) return;
    overrideIncident(id, overrideReason.trim(), overrideOfficer || session?.name || 'Administrator');
    toast.info(
      `Technical Override Applied on ${id}`,
      `Risk tier downgraded with formal supervisory justification by ${overrideOfficer || 'Administrator'}.`
    );
    setIsOverrideFormOpen(false);
    setOverrideReason('');
  };

  const getControlBadgeStyle = (level: ControlLevel) => {
    switch (level) {
      case 'ELIMINATION':
        return 'text-red-400';
      case 'SUBSTITUTION':
        return 'text-purple-400';
      case 'ENGINEERING':
        return 'text-amber-400';
      case 'ADMINISTRATIVE':
        return 'text-blue-400';
      case 'PPE':
        return 'text-emerald-400';
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Backdrop click handler */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        ref={modalRef}
        className="relative z-10 w-full h-[100dvh] sm:h-auto sm:max-w-4xl max-h-[100dvh] sm:max-h-[88dvh] flex flex-col bg-app-surface border-0 sm:border sm:border-app-subtle rounded-none sm:rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* ── Modal Header (Pinned Top) ───────────────────────────── */}
        <div data-gsap-modal-header className="flex-shrink-0 p-4 sm:p-5 border-b border-app-subtle bg-app-elevated/80 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-base font-bold text-app-primary tracking-tight">
                {id}
              </span>
              <span className="text-app-muted/60">•</span>
              <div className="flex items-center gap-1.5 text-xs font-sans text-app-secondary truncate">
                <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37] flex-shrink-0" />
                <span className="truncate">{site}</span>
              </div>
              <span className="text-app-muted/60">•</span>
              <StatusChip status={validationStatus} isActionable={false} />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-app-muted font-sans">
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <Clock className="w-3 h-3 text-app-muted" />
                <span>{formatTimestamp(timestamp)}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-3 h-3 text-app-muted" />
                <span>{reportedBy}</span>
              </div>
              <span className="uppercase text-[11px] font-semibold text-amber-700 dark:text-amber-400 tracking-wider">
                {category.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-lg text-app-muted hover:text-app-primary hover:bg-app-elevated transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ── Scrollable Body: Lead with SIF Risk, Evidence & Controls ─ */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 custom-scrollbar bg-app-page">
          {/* Escalation Notification Toast */}
          {showEscalationSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700/60 flex items-center gap-2 text-xs font-sans text-emerald-800 dark:text-emerald-300 animate-fade-in-scale">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>
                STOP-WORK ADVISORY DISPATCHED: SIF precursor escalation logged and transmitted to field safety dispatch.
              </span>
            </div>
          )}

          {/* Review History Bar (when confirmed or overridden) */}
          {(validationStatus === 'CONFIRMED' || validationStatus === 'OVERRIDDEN') && (
            <div className="p-3 rounded-lg bg-app-elevated/60 border border-app-subtle text-xs font-sans space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-app-primary flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      validationStatus === 'CONFIRMED' ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  Reviewed by {reviewedBy || 'Administrator'}
                </span>
                <span className="font-mono text-[11px] text-app-muted">
                  {reviewedAt ? formatTimestamp(reviewedAt) : ''}
                </span>
              </div>
              {overrideJustification && (
                <p className="text-app-secondary text-xs italic pt-1 border-t border-app-subtle">
                  Justification: &quot;{overrideJustification}&quot;
                </p>
              )}
              {escalationNotes && (
                <p className="text-app-secondary text-xs pt-1 border-t border-app-subtle">
                  Notes: {escalationNotes}
                </p>
              )}
            </div>
          )}

          {/* SECTION 1: Deterministic SIF Risk Score & Life-Saving Rule Violation */}
          <div data-gsap-modal-section className="p-4 rounded-xl bg-app-surface border border-app-subtle space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-sans font-semibold text-app-muted uppercase tracking-wider block">
                  Deterministic SIF Risk Score
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-mono font-semibold text-app-primary tracking-tight">
                    <span ref={scoreSpanRef}>{targetScore}</span>
                    <span className="text-xs text-app-muted font-mono">/100</span>
                  </span>
                  <RiskBadge level={riskLevel} score={riskScore} size="sm" />
                </div>
              </div>

              {isSifPrecursor && (
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800/40 px-2.5 py-1 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    SIF Precursor Flagged
                  </span>
                </div>
              )}
            </div>

            {/* Life-Saving Rule Violation Summary */}
            <div className="pt-3 border-t border-app-subtle space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-app-muted font-sans">IOGP Life-Saving Rule:</span>
                <span className="font-sans font-semibold text-amber-700 dark:text-[#D4AF37]">{lsrTitle}</span>
              </div>

              {lsrViolations && lsrViolations.length > 0 && (
                <div className="space-y-1 pt-1">
                  {lsrViolations.map((v, idx) => (
                    <div key={idx} className="text-xs font-sans text-app-secondary flex items-start gap-1.5">
                      <span className="text-red-500 flex-shrink-0">•</span>
                      <span>{v.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 1B: Escalation Likelihood Indicator (Deterministic, Non-Statistical Heuristic) */}
          <div data-gsap-modal-section>
            <EscalationLikelihoodGauge data={selectedIncident.escalationLikelihood} />
          </div>

          {/* SECTION 2: Explainable AI (XAI) Trigger Signals */}
          <div data-gsap-modal-section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-semibold text-app-primary uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />
                Explainability Triggers & Evidence
              </span>
              <span className="text-xs font-sans text-app-muted font-normal">
                {xaiTriggers.length} domain triggers identified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {xaiTriggers.map((trig, idx) => {
                const isNegation = trig.isNegation;
                const accentColor = isNegation
                  ? 'border-l-2 border-red-500 bg-red-50 dark:bg-red-950/20'
                  : 'border-l-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20';

                const weightPct =
                  trig.weight <= 1
                    ? Math.round(trig.weight * 100)
                    : Math.min(Math.round(trig.weight), 100);

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-r-lg border border-l-0 border-app-subtle ${accentColor} space-y-1 font-sans shadow-2xs`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span className={isNegation ? 'text-red-700 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}>
                          {trig.token}
                        </span>
                        {isNegation && (
                          <span className="text-[10px] font-sans font-semibold uppercase text-red-600 dark:text-red-400 tracking-wider">
                            [Safety Negation]
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs text-app-muted font-semibold">
                        weight: {weightPct}%
                      </span>
                    </div>

                    <p className="text-xs text-app-secondary leading-relaxed italic">
                      &quot;{trig.context}&quot;
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: Prescriptive Hierarchy of Controls Response */}
          <div data-gsap-modal-section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-semibold text-app-primary uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />
                Recommended Hierarchy of Controls
              </span>
              <span className="text-xs font-sans text-app-muted font-normal">Standard OISD Protocol</span>
            </div>

            <div className="space-y-2">
              {hierarchyActions.map((action) => (
                <div
                  key={action.order}
                  className="p-3 rounded-lg bg-app-surface border border-app-subtle flex items-start gap-3 font-sans shadow-xs"
                >
                  <span className="w-5 h-5 rounded-full bg-app-elevated border border-app-subtle flex items-center justify-center font-mono text-xs font-semibold text-app-primary flex-shrink-0 mt-0.5">
                    {action.order}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-sans font-semibold uppercase tracking-wider ${getControlBadgeStyle(action.level)}`}>
                        {action.level}
                      </span>
                      <span className="text-app-muted/60">•</span>
                      <span
                        className={`text-xs uppercase tracking-wider ${
                          action.urgency === 'IMMEDIATE'
                            ? 'text-red-600 dark:text-red-400 font-semibold'
                            : 'text-app-muted'
                        }`}
                      >
                        {action.urgency}
                      </span>
                    </div>
                    <p className="text-xs text-app-secondary leading-relaxed font-normal">
                      {action.action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: Verbatim Observation Narrative (COLLAPSED by default per master prompt) */}
          <div className="border border-app-subtle rounded-xl bg-app-surface overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setIsNarrativeExpanded(!isNarrativeExpanded)}
              className="w-full min-h-[44px] p-3.5 flex items-center justify-between text-left text-xs font-sans font-semibold text-app-primary hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer bg-app-elevated/50"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />
                <span>Verbatim Field Incident Narrative (Raw Prose)</span>
              </div>
              {isNarrativeExpanded ? (
                <ChevronDown className="w-4 h-4 text-app-muted" />
              ) : (
                <ChevronRight className="w-4 h-4 text-app-muted" />
              )}
            </button>

            {isNarrativeExpanded ? (
              <div className="p-4 border-t border-app-subtle text-xs font-sans text-app-secondary leading-relaxed bg-app-surface">
                {rawNarrative}
              </div>
            ) : (
              <div className="px-4 py-2.5 text-xs font-sans text-app-muted truncate bg-app-surface">
                {rawNarrative.substring(0, 90)}... <span className="text-amber-600 dark:text-[#D4AF37] font-medium ml-1">Click to expand</span>
              </div>
            )}
          </div>

          {/* SECTION 5: Inline Override Justification Form (When requested by Admin) */}
          {isOverrideFormOpen && canEscalate && (
            <form
              onSubmit={handleOverrideSubmit}
              className="p-4 rounded-xl bg-app-elevated border border-app-strong space-y-3 font-sans shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-app-primary flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Technical Justification for SIF Override
                </span>
                <button
                  type="button"
                  onClick={() => setIsOverrideFormOpen(false)}
                  className="min-h-[44px] px-2 text-xs text-app-muted hover:text-app-primary cursor-pointer inline-flex items-center"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-app-muted">
                DGMS & OISD compliance requires written technical justification before downgrading
                an automated high-energy SIF precursor trigger.
              </p>
              <textarea
                required
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g., Secondary containment barrier verified intact; air monitoring log certifies zero LEL at 08:30 hrs..."
                className="w-full p-3 rounded-lg bg-app-surface border border-app-subtle text-xs text-app-primary placeholder:text-app-muted focus:outline-none focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3] font-sans shadow-2xs"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <input
                  type="text"
                  value={overrideOfficer}
                  onChange={(e) => setOverrideOfficer(e.target.value)}
                  className="px-3 py-2 text-xs font-sans bg-app-surface border border-app-subtle rounded-md text-app-primary w-56 min-h-[44px]"
                  placeholder="Officer Name"
                />
                <button
                  type="submit"
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-[#0066CC] hover:bg-[#0077ED] rounded-md transition-colors cursor-pointer inline-flex items-center justify-center shadow-xs"
                >
                  Submit Override
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Modal Footer: Human-in-the-Loop Actions (ADMIN ONLY) ──────── */}
        {/* If USER: Section is completely omitted per prompt specification */}
        {canEscalate && (
          <div className="flex-shrink-0 p-4 sm:p-5 border-t border-app-subtle bg-app-elevated/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleConfirm}
              className="w-full sm:flex-1 min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-sans font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>CONFIRM & ESCALATE</span>
            </button>

            <button
              onClick={() => setIsOverrideFormOpen(true)}
              className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-sans font-semibold text-xs text-app-secondary border border-app-strong hover:border-[#0066CC] hover:text-[#0066CC] dark:hover:border-[#2997FF] dark:hover:text-[#2997FF] bg-app-surface active:scale-95 transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>DOWNGRADE / OVERRIDE</span>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
