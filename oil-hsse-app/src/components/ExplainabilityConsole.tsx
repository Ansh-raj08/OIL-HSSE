'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Explainable AI (XAI) & Supervisory Decision Modal (Master Prompt Section 3)
// Full-featured decision workflow in a focused modal dialog
// ============================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useGsapModalReveal, useGsapRiskScoreReveal } from '@/hooks/useGsap';
import { useSafety } from '@/context/SafetyContext';
import { useAuth } from '@/context/AuthContext';
import { useTimeFormat } from '@/context/TimeFormatContext';
import { useToast } from '@/context/ToastContext';
import { ControlLevel, LSRCode, LSR_DICTIONARY } from '@/types/safety';
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
  Mail,
  Send,
  Copy,
  Check,
  ExternalLink,
  Edit3,
} from 'lucide-react';

export interface ConcernedHead {
  name: string;
  designation: string;
  email: string;
  jurisdiction: string;
}

export function getConcernedHeadForSite(siteName: string): ConcernedHead {
  const lower = (siteName || '').toLowerCase();
  if (lower.includes('duliajan') || lower.includes('rig #7') || lower.includes('drilling')) {
    return {
      name: 'Er. B. K. Gogoi',
      designation: 'Chief General Manager (Drilling & Field Operations)',
      email: 'cgm.drilling.duliajan@oilindia.in',
      jurisdiction: 'Duliajan Operational Headquarters & Deep Drilling Assets',
    };
  }
  if (lower.includes('moran') || lower.includes('ggs')) {
    return {
      name: 'Er. R. K. Saikia',
      designation: 'General Manager (Moran Production & Gas Gathering)',
      email: 'area.head.moran@oilindia.in',
      jurisdiction: 'Moran Gas Gathering Stations & Upstream Well Manifolds',
    };
  }
  if (lower.includes('naharkatiya') || lower.includes('workover') || lower.includes('well #114')) {
    return {
      name: 'Er. P. K. Hazarika',
      designation: 'Deputy General Manager (Workover & Well Servicing)',
      email: 'head.workover.nhk@oilindia.in',
      jurisdiction: 'Naharkatiya Field Well Services & Rig Workover Units',
    };
  }
  if (lower.includes('digboi') || lower.includes('ctf') || lower.includes('crude ctf')) {
    return {
      name: 'Er. A. K. Barman',
      designation: 'General Manager (Surface Facilities & Storage Ops)',
      email: 'head.surface.digboi@oilindia.in',
      jurisdiction: 'Digboi Central Tank Farm & Terminal Dispatch',
    };
  }
  if (lower.includes('kumchai')) {
    return {
      name: 'Er. M. K. Chaliha',
      designation: 'General Manager (Exploration & Frontier Drilling)',
      email: 'head.exploration.kumchai@oilindia.in',
      jurisdiction: 'Kumchai Exploratory Drilling Blocks',
    };
  }
  if (lower.includes('dikom')) {
    return {
      name: 'Er. N. K. Sharma',
      designation: 'Installation Manager (Dikom CTF & Pumping Station)',
      email: 'installation.mgr.dikom@oilindia.in',
      jurisdiction: 'Dikom Central Tank Farm & Processing Enclave',
    };
  }
  if (lower.includes('borbil')) {
    return {
      name: 'Er. D. J. Das',
      designation: 'Rig Superintendent (Borbil Drilling Asset)',
      email: 'rig.superintendent.borbil@oilindia.in',
      jurisdiction: 'Borbil Wellsite Clusters',
    };
  }
  if (lower.includes('shalmari')) {
    return {
      name: 'Er. S. R. Gogoi',
      designation: 'Production Superintendent (Shalmari Asset)',
      email: 'production.head.shalmari@oilindia.in',
      jurisdiction: 'Shalmari Production Wells & Trunk Manifolds',
    };
  }
  return {
    name: 'Er. T. Baruah',
    designation: 'Chief HSSE Superintendent & Area General Manager',
    email: 'gm.hsse.assam@oilindia.in',
    jurisdiction: 'Assam Operational Basin - Central HSSE Directorate',
  };
}

interface ExplainabilityConsoleProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ExplainabilityConsole({ isOpen = true, onClose }: ExplainabilityConsoleProps) {
  const {
    selectedIncident,
    confirmAndEscalate,
    overrideIncident,
    updateIncidentLsr,
    dispatchAdvisory,
  } = useSafety();
  const { session, canEscalate, role } = useAuth();
  const { formatTimestamp } = useTimeFormat();
  const toast = useToast();

  const [isMounted, setIsMounted] = useState(false);
  const [isOverrideFormOpen, setIsOverrideFormOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideOfficer, setOverrideOfficer] = useState(session?.name || 'Administrator');
  const [escalationNote, setEscalationNote] = useState('');
  const [showEscalationSuccess, setShowEscalationSuccess] = useState(false);
  const [showAdvisorySuccess, setShowAdvisorySuccess] = useState(false);
  const [isNarrativeExpanded, setIsNarrativeExpanded] = useState(false);

  // New Features: IOGP Rule selector & Area Head Email composer
  const [isLsrSelectorOpen, setIsLsrSelectorOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailCc, setEmailCc] = useState('hsse.directorate@oilindia.in, field.safety.oil@oilindia.in');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isCopied, setIsCopied] = useState(false);

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

  // Sync email composer fields whenever selected incident changes
  const concernedHead = useMemo(() => {
    return getConcernedHeadForSite(selectedIncident?.site || '');
  }, [selectedIncident?.site]);

  useEffect(() => {
    if (selectedIncident) {
      const head = getConcernedHeadForSite(selectedIncident.site);
      setEmailTo(head.email);
      setEmailCc('hsse.directorate@oilindia.in, field.safety.oil@oilindia.in');
      setEmailSubject(
        `[URGENT HSSE ADVISORY] SIF Precursor Alert - ${selectedIncident.id} (${selectedIncident.site}) - Risk Score: ${selectedIncident.riskScore}/100`
      );

      const topAction =
        selectedIncident.hierarchyActions?.[0]?.action ||
        'Immediate stop-work verification and critical physical barrier inspection.';

      const bodyText = `ATTENTION: ${head.name} (${head.designation})
JURISDICTION: ${head.jurisdiction}
LOCATION: ${selectedIncident.site} (${selectedIncident.basin})
INCIDENT ID: ${selectedIncident.id}
TIMESTAMP: ${selectedIncident.timestamp}
REPORTED BY: ${selectedIncident.reportedBy}

=== HSSE SIF-PRECURSOR NOTIFICATION & ACTION DIRECTIVE ===
SIF PRECURSOR FLAG: ${selectedIncident.isSifPrecursor ? 'YES (HIGH-ENERGY PRECURSOR)' : 'NO'}
DETERMINISTIC SIF SCORE: ${selectedIncident.riskScore}/100 (${selectedIncident.riskLevel})
IOGP LIFE-SAVING RULE: ${selectedIncident.lsrTitle}
RECOMMENDED PRIMARY CONTROL: ${topAction}

VERBATIM FIELD INCIDENT NARRATIVE:
"${selectedIncident.rawNarrative}"

OPERATIONAL DIRECTIVE:
Immediate operational review is requested for ${selectedIncident.site}. Please verify critical barrier integrity, confirm isolation/protective measures, and ensure statutory DGMS/OISD compliance before continuing operations.

Dispatched by: ${session?.name || 'Chief HSSE Superintendent'}
OIL India Limited — Enterprise HSSE Decision-Support Platform`;

      setEmailBody(bodyText);
    }
  }, [selectedIncident, session?.name]);

  // Focus trap & focus return
  useEffect(() => {
    if (isOpen && selectedIncident) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    } else if (!isOpen && previouslyFocusedRef.current) {
      previouslyFocusedRef.current.focus?.();
      previouslyFocusedRef.current = null;
    }
  }, [isOpen, selectedIncident]);

  // Handle escape key to close modal or sub-modals
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEmailModalOpen) {
          setIsEmailModalOpen(false);
        } else if (isLsrSelectorOpen) {
          setIsLsrSelectorOpen(false);
        } else if (isOverrideFormOpen) {
          setIsOverrideFormOpen(false);
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEmailModalOpen, isLsrSelectorOpen, isOverrideFormOpen, onClose]);

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

  const handleConfirm = async () => {
    try {
      await confirmAndEscalate(
        id,
        session?.name || 'Administrator',
        escalationNote ||
          'High-energy SIF Precursor confirmed by Safety Superintendent. Stop-work advisory dispatched to Rig Floor.'
      );
      setShowEscalationSuccess(true);
      toast.success(
        `Incident ${id} Confirmed`,
        'Verified as SIF Precursor. Emergency stop-work advisory logged and dispatched to Rig Floor.'
      );
      setTimeout(() => setShowEscalationSuccess(false), 4000);
    } catch {
      // Honest error toast already dispatched by SafetyContext
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) return;
    try {
      await overrideIncident(id, overrideReason.trim(), overrideOfficer || session?.name || 'Administrator');
      toast.info(
        `Technical Override Applied on ${id}`,
        `Risk tier downgraded with formal supervisory justification by ${overrideOfficer || 'Administrator'}.`
      );
      setIsOverrideFormOpen(false);
      setOverrideReason('');
    } catch {
      // Honest error toast already dispatched by SafetyContext
    }
  };

  const handleLsrSelect = (ruleCode: LSRCode, fullTitle: string) => {
    if (!selectedIncident) return;
    updateIncidentLsr(selectedIncident.id, ruleCode, fullTitle);
    toast.success(
      'IOGP Rule Reclassified',
      `Incident ${selectedIncident.id} updated to "${fullTitle}".`
    );
    setIsLsrSelectorOpen(false);
  };

  const handleLaunchEmailClient = () => {
    if (!emailTo) return;
    const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?cc=${encodeURIComponent(
      emailCc
    )}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
    toast.info(
      'Email Client Launched',
      `Opening default mail client with advisory drafted for ${emailTo}.`
    );
  };

  const handleCopyEmailBody = async () => {
    try {
      await navigator.clipboard.writeText(emailBody);
      setIsCopied(true);
      toast.success('Advisory Copied', 'Advisory dispatch brief copied to clipboard.');
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      toast.error('Copy Failed', 'Failed to copy to clipboard.');
    }
  };

  const handleSendDirectDispatch = () => {
    if (!selectedIncident) return;
    dispatchAdvisory(
      selectedIncident.id,
      emailTo,
      session?.name || 'Administrator',
      emailSubject
    );
    setShowAdvisorySuccess(true);
    toast.success(
      'Advisory Dispatched',
      `Formal emergency advisory logged and dispatched to ${emailTo}.`
    );
    setIsEmailModalOpen(false);
    setTimeout(() => setShowAdvisorySuccess(false), 5000);
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

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsEmailModalOpen(true)}
              className="min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 dark:text-[#2997FF] bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/80 transition-all cursor-pointer font-sans"
              title="Email concerned area head for this incident"
            >
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Email Area Head</span>
              <span className="sm:hidden">Email</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="min-w-[38px] min-h-[38px] flex items-center justify-center p-2 rounded-lg text-app-muted hover:text-app-primary hover:bg-app-elevated transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
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

          {/* Advisory Sent Notification Banner */}
          {(showAdvisorySuccess || selectedIncident.dispatchedAdvisory) && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-700/60 flex items-center justify-between text-xs font-sans text-blue-900 dark:text-blue-200 animate-fade-in-scale">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600 dark:text-[#2997FF] flex-shrink-0" />
                <span>
                  ADVISORY DISPATCHED: Official notice transmitted to{' '}
                  <strong>{selectedIncident.dispatchedAdvisory?.recipient || emailTo}</strong>.
                </span>
              </div>
              <span className="font-mono text-[11px] text-blue-700 dark:text-blue-300">
                {selectedIncident.dispatchedAdvisory?.sentAt || 'Just now'}
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

            {/* Life-Saving Rule Violation Summary with Reclassify Toggle */}
            <div className="pt-3 border-t border-app-subtle space-y-2">
              <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-app-muted font-sans">IOGP Life-Saving Rule:</span>
                  <span className="font-sans font-semibold text-amber-700 dark:text-[#D4AF37]">{lsrTitle}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLsrSelectorOpen(!isLsrSelectorOpen)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-sans font-semibold text-[#0066CC] dark:text-[#2997FF] bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                  title="Change or correct misprinted IOGP Life-Saving Rule"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isLsrSelectorOpen ? 'Close Rule Selector' : 'Change Rule / Fix Misprint'}</span>
                </button>
              </div>

              {/* Interactive IOGP Rule Selector Grid */}
              {isLsrSelectorOpen && (
                <div className="p-3 rounded-xl bg-app-elevated border border-app-subtle space-y-2.5 animate-fade-in text-xs font-sans shadow-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-app-subtle">
                    <span className="font-semibold text-app-primary flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />
                      Reclassify IOGP Life-Saving Rule (9 Standard Rules)
                    </span>
                    <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400">
                      Misprint Correction Mode
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                    {Object.values(LSR_DICTIONARY).map((rule) => {
                      const isSelected = selectedIncident.lsrCategory === rule.code;
                      return (
                        <button
                          key={rule.code}
                          type="button"
                          onClick={() => handleLsrSelect(rule.code, `${rule.code}: ${rule.title}`)}
                          className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200 font-semibold shadow-xs'
                              : 'bg-app-surface border-app-subtle hover:bg-app-elevated hover:border-[#0066CC]/40 text-app-primary'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] font-bold">{rule.code}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />}
                          </div>
                          <span className="text-[11px] leading-tight line-clamp-1">{rule.title}</span>
                          <span className="text-[10px] text-app-muted font-normal">{rule.category}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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

        {/* ── Modal Footer: Human-in-the-Loop Actions & Email Dispatch ──────── */}
        <div className="flex-shrink-0 p-4 sm:p-5 border-t border-app-subtle bg-app-elevated/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {canEscalate ? (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:flex-1">
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
          ) : (
            <div className="text-xs text-app-muted font-sans">
              Supervisory Review & SIF Actions: Read-Only ({role})
            </div>
          )}

          {/* Email Area Head Action Button */}
          <button
            type="button"
            onClick={() => setIsEmailModalOpen(true)}
            className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-sans font-semibold text-xs text-blue-700 dark:text-[#2997FF] border border-blue-300 dark:border-blue-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 bg-app-surface active:scale-95 transition-all cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>EMAIL CONCERNED HEAD</span>
          </button>
        </div>
      </div>

      {/* ── Emergency HSSE Advisory Dispatch Composer Modal ───────── */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="w-full max-w-2xl bg-app-surface border border-app-subtle rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-app-subtle bg-app-elevated flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-[#2997FF] border border-blue-500/20">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-sm sm:text-base text-app-primary">
                    Dispatch HSSE Advisory to Concerned Area Head
                  </h3>
                  <p className="font-sans text-xs text-app-muted">
                    Official SIF Precursor Notification per OIL & DGMS Protocols
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="p-1.5 rounded-lg text-app-muted hover:text-app-primary hover:bg-app-elevated transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-4 sm:p-6 space-y-4 text-xs font-sans overflow-y-auto flex-1 custom-scrollbar">
              {/* Concerned Head Target Info Card */}
              <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/40 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />
                    {concernedHead.jurisdiction}
                  </span>
                  <span className="font-mono text-[11px] text-blue-700 dark:text-blue-300 font-semibold">
                    Designated Area Authority
                  </span>
                </div>
                <p className="text-xs text-app-secondary">
                  <strong>{concernedHead.name}</strong> — {concernedHead.designation}
                </p>
              </div>

              {/* Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-app-primary mb-1">
                    To (Concerned Head Official Email):
                  </label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-app-elevated border border-app-subtle text-xs text-app-primary font-mono focus:outline-none focus:border-[#0066CC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-app-primary mb-1">
                    CC (HSSE Directorate & Safety Cell):
                  </label>
                  <input
                    type="text"
                    value={emailCc}
                    onChange={(e) => setEmailCc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-app-elevated border border-app-subtle text-xs text-app-primary font-mono focus:outline-none focus:border-[#0066CC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-app-primary mb-1">
                    Subject:
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-app-elevated border border-app-subtle text-xs text-app-primary font-sans font-medium focus:outline-none focus:border-[#0066CC]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-app-primary">
                      Advisory Message Body:
                    </label>
                    <button
                      type="button"
                      onClick={handleCopyEmailBody}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0066CC] dark:text-[#2997FF] hover:underline cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Body'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full p-3 rounded-lg bg-app-elevated border border-app-subtle text-xs text-app-primary font-mono leading-relaxed focus:outline-none focus:border-[#0066CC]"
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-app-subtle bg-app-elevated flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold text-app-muted hover:text-app-primary cursor-pointer border border-app-subtle hover:bg-app-surface transition-colors"
              >
                Cancel
              </button>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCopyEmailBody}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-app-primary bg-app-surface border border-app-subtle hover:bg-app-elevated transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Brief</span>
                </button>

                <button
                  type="button"
                  onClick={handleLaunchEmailClient}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-blue-700 dark:text-[#2997FF] bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                  title="Launch Outlook or default mail client with prefilled email"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Mail Client</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendDirectDispatch}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Log & Dispatch</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
