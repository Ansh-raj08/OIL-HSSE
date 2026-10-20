'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Single Full-Width Priority Triage List with Inline Explanation & Modal Decisioning
// High-Performance Virtualized Stream with Resilient Loading States
// Pagination: loads 10 at a time; only new rows are animated
// ============================================================

import React, { useMemo, useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useGsapListReveal } from '@/hooks/useGsap';
import { useSafety } from '@/context/SafetyContext';
import { TriageFilter, SafetyIncident } from '@/types/safety';
import { RiskBadge, IncidentMetadata, StatusChip } from '@/components/ui/badge';
import ExplainabilityConsole from '@/components/ExplainabilityConsole';
import EmptyState from '@/components/ui/EmptyState';
import { TriageStreamSkeleton } from '@/components/ui/Skeleton';
import { useTimeFormat } from '@/context/TimeFormatContext';
import EscalationLikelihoodGauge from '@/components/EscalationLikelihoodGauge';
import { evaluateEscalationLikelihood } from '@/lib/logic-engine/analyzer';
import {
  Search,
  AlertCircle,
  MapPin,
  Clock,
  Layers,
  Zap,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Inbox,
  UploadCloud,
  ChevronDown,
} from 'lucide-react';

const PAGE_SIZE = 10;

interface IncidentCardProps {
  incident: SafetyIncident;
  indexNumber: string;
  onSelect: (incident: SafetyIncident) => void;
  formatTimestamp: (ts: string) => string;
}

/**
 * Memoized incident row to eliminate redundant re-renders on bulk loads and clicks.
 */
const IncidentCard = React.memo(function IncidentCard({
  incident,
  indexNumber,
  onSelect,
  formatTimestamp,
}: IncidentCardProps) {
  const topTriggers = useMemo(() => {
    return (incident.xaiTriggers || [])
      .slice()
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);
  }, [incident.xaiTriggers]);

  const hasNegation = useMemo(() => {
    return (incident.xaiTriggers || []).some((t) => t.isNegation);
  }, [incident.xaiTriggers]);

  const escalationData = incident.escalationLikelihood;

  const handleClick = useCallback(() => {
    onSelect(incident);
  }, [onSelect, incident]);

  return (
    <div
      data-gsap-list-item
      onClick={handleClick}
      className="group p-3.5 sm:p-5 rounded-xl border border-app-subtle bg-app-surface hover:bg-app-elevated/60 hover:border-[#0066CC]/40 dark:hover:border-[#2997FF]/40 shadow-xs transition-all duration-150 cursor-pointer min-h-[44px]"
    >
      {/* ── Row Header: Badges, ID, Site, Timestamp, Status, Escalation ──── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="font-mono text-xs font-semibold text-app-muted w-5 text-right select-none">
            {indexNumber}
          </span>
          <RiskBadge level={incident.riskLevel} score={incident.riskScore} />
          <span className="font-mono text-xs font-bold text-app-primary tracking-tight">
            {incident.id}
          </span>
          <span className="text-app-muted/60 hidden sm:inline">•</span>
          <IncidentMetadata category={incident.category} />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-app-muted font-sans">
          <div className="flex items-center gap-1.5 text-app-secondary">
            <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37] flex-shrink-0" />
            <span className="font-medium truncate max-w-[150px] sm:max-w-none">
              {incident.site}
            </span>
          </div>
          <span className="text-app-muted/60 hidden sm:inline">•</span>
          <div className="flex items-center gap-1 font-mono text-[11px] text-app-muted">
            <Clock className="w-3.5 h-3.5 text-app-muted flex-shrink-0" />
            <span>{formatTimestamp(incident.timestamp)}</span>
          </div>
          <span className="text-app-muted/60 hidden sm:inline">•</span>
          <StatusChip status={incident.validationStatus} isActionable />
          <EscalationLikelihoodGauge data={escalationData} compact />
        </div>
      </div>

      {/* ── Narrative Preview (Verbatim Field Prose Preview) ──── */}
      <p className="text-xs font-sans text-app-secondary leading-relaxed line-clamp-2 mb-3 font-normal">
        {incident.rawNarrative}
      </p>

      {/* ── Inline Reason & Explanation Strip ── */}
      <div className="p-2.5 sm:p-3 rounded-lg bg-app-elevated/60 border border-app-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {/* Matched LSR */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 font-sans font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 dark:text-[#D4AF37]" />
            <span className="font-mono text-[11px] font-bold">{incident.lsrCategory}:</span>
            <span className="truncate max-w-[180px] sm:max-w-[320px]">{incident.lsrTitle}</span>
          </div>

          <span className="text-app-muted/60 hidden lg:inline">•</span>

          {/* Key Triggers */}
          <div className="hidden sm:flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-app-muted uppercase tracking-wider">
              Key Triggers:
            </span>
            {topTriggers.length > 0 ? (
              topTriggers.map((trig, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-app-surface text-app-primary border border-app-subtle font-mono text-[11px] shadow-2xs"
                >
                  <Zap className="w-3 h-3 text-amber-600 dark:text-[#D4AF37] flex-shrink-0" />
                  <span>&quot;{trig.token}&quot;</span>
                  <span
                    className={
                      trig.weight >= 20 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-semibold'
                    }
                  >
                    +{trig.weight <= 1 ? Math.round(trig.weight * 100) : Math.round(trig.weight)}
                  </span>
                </span>
              ))
            ) : (
              <span className="text-app-muted font-sans text-xs italic">Routine observation</span>
            )}

            {hasNegation && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800/60 font-mono text-[11px]">
                <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400 flex-shrink-0" />
                <span>Negation Preserved</span>
              </span>
            )}
          </div>

          {/* Mobile triggers */}
          <div className="flex sm:hidden items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-app-muted uppercase tracking-wider">
              Trigger:
            </span>
            {topTriggers.length > 0 ? (
              <>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-app-surface text-app-primary border border-app-subtle font-mono text-[10px] truncate max-w-[160px]">
                  <Zap className="w-2.5 h-2.5 text-amber-600 dark:text-[#D4AF37] flex-shrink-0" />
                  <span className="truncate">&quot;{topTriggers[0].token}&quot;</span>
                </span>
                {topTriggers.length > 1 && (
                  <span className="px-1.5 py-0.5 rounded bg-app-elevated text-app-muted font-mono text-[10px] border border-app-subtle">
                    +{topTriggers.length - 1} more
                  </span>
                )}
              </>
            ) : (
              <span className="text-app-muted font-sans text-xs italic">Routine</span>
            )}
            {hasNegation && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800/60 font-mono text-[10px]">
                <AlertTriangle className="w-2.5 h-2.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <span>Negation</span>
              </span>
            )}
          </div>
        </div>

        {/* Action affordance */}
        <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-app-muted group-hover:text-amber-600 dark:group-hover:text-[#D4AF37] transition-colors whitespace-nowrap self-end lg:self-auto min-h-[32px]">
          <span>Inspect Details & Actions</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
});

export default function TriageStream() {
  const {
    incidents,
    filter,
    searchQuery,
    setFilter,
    setSearchQuery,
    selectIncident,
    openIngestionModal,
    isLoading,
  } = useSafety();
  const { formatTimestamp } = useTimeFormat();

  const [isModalOpen, setIsModalOpen] = useState(false);
  // Pagination — how many rows are currently visible in the list
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const listRef = useRef<HTMLDivElement>(null);
  const virtualContainerRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  // Accurately measure document offset for virtualizer container across resizes and layout shifts
  useLayoutEffect(() => {
    const updateScrollMargin = () => {
      const targetEl = virtualContainerRef.current || listRef.current;
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        setScrollMargin(Math.max(0, Math.round(top)));
      }
    };

    updateScrollMargin();
    window.addEventListener('resize', updateScrollMargin, { passive: true });

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && listRef.current) {
      observer = new ResizeObserver(updateScrollMargin);
      observer.observe(listRef.current);
      if (listRef.current.parentElement) {
        observer.observe(listRef.current.parentElement);
      }
    }

    return () => {
      window.removeEventListener('resize', updateScrollMargin);
      observer?.disconnect();
    };
  }, [isLoading]);

  const filterOptions: TriageFilter[] = [
    'ALL',
    'CRITICAL',
    'HIGH',
    'MEDIUM',
    'LOW',
    'PENDING REVIEW',
  ];

  // Filtering logic
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      if (filter === 'CRITICAL' && incident.riskLevel !== 'CRITICAL') return false;
      if (filter === 'HIGH' && incident.riskLevel !== 'HIGH') return false;
      if (filter === 'MEDIUM' && incident.riskLevel !== 'MEDIUM') return false;
      if (filter === 'LOW' && incident.riskLevel !== 'LOW') return false;
      if (filter === 'PENDING REVIEW' && incident.validationStatus !== 'PENDING')
        return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = incident.id.toLowerCase().includes(query);
        const matchesSite = incident.site.toLowerCase().includes(query);
        const matchesNarrative = incident.rawNarrative.toLowerCase().includes(query);
        const matchesLsr = incident.lsrTitle.toLowerCase().includes(query);
        if (!matchesId && !matchesSite && !matchesNarrative && !matchesLsr) {
          return false;
        }
      }

      return true;
    });
  }, [incidents, filter, searchQuery]);

  const [prevFilter, setPrevFilter] = useState(filter);
  const [prevSearch, setPrevSearch] = useState(searchQuery);

  // Reset page count cleanly when filter or search changes without cascading renders
  if (filter !== prevFilter || searchQuery !== prevSearch) {
    setPrevFilter(filter);
    setPrevSearch(searchQuery);
    setVisibleCount(PAGE_SIZE);
  }

  // Smooth scroll back to top of triage table when filters change
  useEffect(() => {
    if (scrollMargin > 0 && window.scrollY > scrollMargin) {
      window.scrollTo({ top: Math.max(0, scrollMargin - 90), behavior: 'smooth' });
    }
  }, [filter, searchQuery, scrollMargin]);

  // Slice to what's actually visible right now
  const visibleIncidents = useMemo(
    () => filteredIncidents.slice(0, visibleCount),
    [filteredIncidents, visibleCount]
  );

  const hasMore = visibleCount < filteredIncidents.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredIncidents.length));
  }, [filteredIncidents.length]);

  // GSAP: animate newly revealed items without accessing refs in render
  useGsapListReveal(
    listRef as React.RefObject<HTMLElement | null>,
    visibleIncidents.length
  );

  // Virtualization: window-based virtualizer for large fully-loaded sets > 25 rows
  const shouldUseVirtualization = visibleIncidents.length > 25;
  const rowVirtualizer = useWindowVirtualizer({
    count: visibleIncidents.length,
    estimateSize: () => 170,
    overscan: 6,
    scrollMargin,
    getItemKey: (index) => visibleIncidents[index]?.id ?? index,
    enabled: shouldUseVirtualization,
  });

  const handleRowClick = useCallback(
    (incident: SafetyIncident) => {
      selectIncident(incident);
      setIsModalOpen(true);
    },
    [selectIncident]
  );

  return (
    <div className="flex flex-col w-full bg-app-surface border border-app-subtle rounded-xl overflow-hidden shadow-sm">
      {/* ── Section Header & Filter Controls ────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-app-subtle bg-app-elevated/40 space-y-4">
        {/* Title Bar & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-app-surface border border-app-subtle text-amber-600 dark:text-[#D4AF37] shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold font-sans text-app-primary tracking-wide flex items-center gap-2">
                <span>PRIORITY TRIAGE REGISTER</span>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-app-surface text-amber-700 dark:text-[#D4AF37] border border-app-subtle">
                  {isLoading
                    ? '...'
                    : filteredIncidents.length === 0
                    ? '0 RECORDS'
                    : `${visibleIncidents.length} / ${filteredIncidents.length} RECORDS`}
                </span>
              </h2>
              <p className="text-xs font-sans text-app-muted">
                Single full-width risk-ordered register with inline Explainable AI justifications
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-app-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search site, narrative, LSR rule, ID..."
              className="w-full pl-9 pr-8 py-2 bg-app-surface border border-app-subtle focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3] rounded-lg text-xs font-sans text-app-primary placeholder:text-app-muted focus:outline-none transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-app-muted hover:text-app-primary cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Pill Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {filterOptions.map((opt) => {
            const isActive = filter === opt;
            return (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0066CC] text-white shadow-xs'
                    : 'bg-app-surface text-app-secondary border border-app-subtle hover:border-app-strong hover:bg-app-elevated'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Single Full-Width Incident Stream with Virtualization & Skeletons ── */}
      <div ref={listRef} className="p-4 sm:p-5">
        {isLoading ? (
          <TriageStreamSkeleton count={4} />
        ) : incidents.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No incidents yet"
            description="No safety incident observations or field logs have been ingested into the triage register."
            action={{
              label: 'Upload Field CSV / Ingest Logs',
              onClick: openIngestionModal,
              icon: UploadCloud,
            }}
            className="my-6"
          />
        ) : filteredIncidents.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="No matching incident logs found"
            description="Try adjusting the filter criteria or clear your search query."
            action={{
              label: 'Reset Filters',
              onClick: () => {
                setFilter('ALL');
                setSearchQuery('');
              },
            }}
            className="my-6"
          />
        ) : shouldUseVirtualization ? (
          /* Virtualized rendering for large fully-loaded visible set (> 25 items) */
          <div
            ref={virtualContainerRef}
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const incident = visibleIncidents[virtualRow.index];
              if (!incident) return null;
              // Absolute index across full dataset so numbering is stable
              const absIdx = filteredIncidents.indexOf(incident);
              const indexNumber = String((absIdx === -1 ? virtualRow.index : absIdx) + 1).padStart(2, '0');
              const translateY = Math.max(0, virtualRow.start - (rowVirtualizer.options.scrollMargin ?? scrollMargin));

              return (
                <div
                  key={incident.id}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${translateY}px)`,
                    paddingBottom: '14px',
                  }}
                >
                  <IncidentCard
                    incident={incident}
                    indexNumber={indexNumber}
                    onSelect={handleRowClick}
                    formatTimestamp={formatTimestamp}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          /* Direct rendering for compact visible slice (<= 25 items shown) */
          <div className="space-y-3.5">
            {visibleIncidents.map((incident) => {
              const absIdx = filteredIncidents.indexOf(incident);
              const indexNumber = String((absIdx === -1 ? 0 : absIdx) + 1).padStart(2, '0');
              return (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  indexNumber={indexNumber}
                  onSelect={handleRowClick}
                  formatTimestamp={formatTimestamp}
                />
              );
            })}
          </div>
        )}

        {/* ── Load More Button ─────────────────────────────────────── */}
        {!isLoading && hasMore && (
          <div className="flex flex-col items-center gap-2 pt-4 border-t border-app-subtle">
            <button
              onClick={handleLoadMore}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-sans font-semibold text-white bg-[#0066CC] hover:bg-[#0077ED] active:scale-[0.98] transition-all shadow-xs cursor-pointer min-h-[40px]"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>
                Load {Math.min(PAGE_SIZE, filteredIncidents.length - visibleCount)} more
                &nbsp;·&nbsp;
                {filteredIncidents.length - visibleCount} remaining
              </span>
            </button>
            <p className="text-[11px] font-mono text-app-muted">
              Showing {visibleIncidents.length} of {filteredIncidents.length} incidents
            </p>
          </div>
        )}
      </div>

      {/* ── Explainable AI & Supervisory Decision Modal ─────────────── */}
      <ExplainabilityConsole
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
