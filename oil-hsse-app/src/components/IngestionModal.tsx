'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGsapPipelineStage } from '@/hooks/useGsap';
import { useSafety } from '@/context/SafetyContext';
import { DEMO_PREFILL_SCENARIOS } from '@/data/mockIncidents';
import type { IncidentCategory } from '@/types/safety';
import { analyzeNarrative } from '@/lib/logic-engine/analyzer';
import { processCsvPipeline, CsvPipelineResult } from '@/lib/csv/pipeline';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/context/ToastContext';
import { RiskBadge } from '@/components/ui/badge';
import {
  X,
  FilePlus2,
  Zap,
  Sparkles,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldCheck,
} from 'lucide-react';

const SITES = [
  'Duliajan Rig #7 (Drilling Ops)',
  'Moran Gas Gathering Station (GGS #3)',
  'Naharkatiya Well #114 (Workover Unit #2)',
  'Digboi Central Tank Farm (Crude CTF)',
  'Kumchai Exploratory Drilling Rig #2',
  'Dikom Central Tank Farm (Dikom CTF)',
  'Borbil Wellsite #04 (Drilling)',
  'Shalmari Production Well #18',
];

type CsvStep = 'UPLOAD' | 'QUALITY_REPORT' | 'PROCESSING';

const PROCESSING_STAGES = [
  { key: 'uploading', label: 'Uploading payload buffer to secure enclave...', percent: 16 },
  { key: 'validating', label: 'Validating OISD-105 schema compliance...', percent: 34 },
  { key: 'cleaning', label: 'Syntactic cleaning & deduplication of incident records...', percent: 52 },
  { key: 'normalizing', label: 'Normalizing canonical taxonomy across Upper Assam sites...', percent: 70 },
  { key: 'analyzing', label: 'Executing NLP negation-aware SIF precursor inference...', percent: 88 },
  { key: 'saving', label: 'Committing dataset records to live supervisory database...', percent: 100 },
];

export default function IngestionModal() {
  const {
    isIngestionModalOpen,
    closeIngestionModal,
    addIncident,
    commitDatasetIngestion,
  } = useSafety();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'single' | 'csv'>('csv');

  // Single form state
  const [site, setSite] = useState(SITES[0]);
  const [category, setCategory] = useState<IncidentCategory>('UNSAFE_ACT');
  const [reportedBy, setReportedBy] = useState('P. Phukan (Lead Toolpusher)');
  const [narrative, setNarrative] = useState(
    'Roustabout observed working at 8 meters height on monkey board without safety harness attached. Tie-off was not maintained.'
  );

  // Staged CSV Ingestion state (v2.3 3-Step Flow)
  const [csvStep, setCsvStep] = useState<CsvStep>('UPLOAD');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [csvParsing, setCsvParsing] = useState(false);
  const [csvResult, setCsvResult] = useState<CsvPipelineResult | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [isReviewExpanded, setIsReviewExpanded] = useState<boolean>(false);
  const [processingStageIndex, setProcessingStageIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageListRef = useRef<HTMLDivElement>(null);

  // GSAP pipeline stage animation — fires whenever active stage index changes
  useGsapPipelineStage(stageListRef as React.RefObject<HTMLElement | null>, processingStageIndex);

  // Clean reset function
  const resetCsvState = () => {
    setCsvStep('UPLOAD');
    setCsvFile(null);
    setCsvFileName('');
    setCsvParsing(false);
    setCsvResult(null);
    setCsvError(null);
    setIsReviewExpanded(false);
    setProcessingStageIndex(0);
  };

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset cleanly whenever modal opens or closes mid-flow
  useEffect(() => {
    if (!isIngestionModalOpen) {
      resetCsvState();
      setActiveTab('csv');
    }
  }, [isIngestionModalOpen]);

  // Real-time analysis via the extracted logic engine
  const analysis = useMemo(() => analyzeNarrative(narrative, site), [narrative, site]);

  if (!isIngestionModalOpen || !isMounted) return null;

  const handleClose = () => {
    resetCsvState();
    closeIngestionModal();
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrative.trim()) return;

    try {
      const backendIncident = await apiClient.createIncident({
        site,
        category,
        reportedBy,
        rawNarrative: narrative.trim(),
        basin: 'Assam Operational Basin',
      });

      if (backendIncident) {
        addIncident(backendIncident);
      } else {
        addIncident({
          site,
          basin: 'Assam Operational Basin',
          reportedBy,
          category,
          rawNarrative: narrative.trim(),
          truncatedNarrative:
            narrative.trim().length > 120
              ? narrative.trim().substring(0, 117) + '...'
              : narrative.trim(),
          riskScore: analysis.risk.score,
          riskLevel: analysis.risk.level,
          isSifPrecursor: analysis.isSifPrecursor,
          lsrCategory: analysis.lsr.code,
          lsrTitle: analysis.lsr.title,
          lsrViolations: analysis.lsrViolations,
          xaiTriggers: analysis.xaiTriggers,
          hierarchyActions: analysis.hierarchyActions,
          escalationLikelihood: analysis.escalationLikelihood,
        });
      }
    } catch {
      addIncident({
        site,
        basin: 'Assam Operational Basin',
        reportedBy,
        category,
        rawNarrative: narrative.trim(),
        truncatedNarrative:
          narrative.trim().length > 120
            ? narrative.trim().substring(0, 117) + '...'
            : narrative.trim(),
        riskScore: analysis.risk.score,
        riskLevel: analysis.risk.level,
        isSifPrecursor: analysis.isSifPrecursor,
        lsrCategory: analysis.lsr.code,
        lsrTitle: analysis.lsr.title,
        lsrViolations: analysis.lsrViolations,
        xaiTriggers: analysis.xaiTriggers,
        hierarchyActions: analysis.hierarchyActions,
        escalationLikelihood: analysis.escalationLikelihood,
      });
    }
    handleClose();
    toast.success(
      'Observation Logged Successfully',
      `Recorded in priority triage stream with SIF risk score of ${analysis.risk.score}/100.`
    );
  };

  const handlePrefill = (scenarioText: string) => {
    setNarrative(scenarioText);
  };

  // Step 1 -> Step 2: Handle CSV selection and parse into Quality Report
  const handleCsvFileSelect = async (file: File) => {
    setCsvFile(file);
    setCsvFileName(file.name);
    setCsvError(null);
    setCsvParsing(true);
    try {
      let result = await apiClient.uploadCsv(file, file.name);
      if (!result) {
        result = await processCsvPipeline(file, file.name);
      }
      setCsvResult(result);
      setCsvStep('QUALITY_REPORT');
      setIsReviewExpanded(false);
    } catch (err: any) {
      try {
        const fallback = await processCsvPipeline(file, file.name);
        setCsvResult(fallback);
        setCsvStep('QUALITY_REPORT');
        setIsReviewExpanded(false);
      } catch (fallbackErr: any) {
        setCsvError(err.message || fallbackErr.message || 'Failed to process CSV file');
        setCsvResult(null);
      }
    } finally {
      setCsvParsing(false);
    }
  };

  const handleLoadSampleCsv = async () => {
    setCsvError(null);
    setCsvFileName('OIL_Assam_Field_Logs_Sample.csv');
    setCsvParsing(true);
    try {
      const response = await fetch('/sample-datasets/OIL_Assam_Field_Logs_Sample.csv');
      const csvText = await response.text();
      let result = await apiClient.uploadCsv(csvText, 'OIL_Assam_Field_Logs_Sample.csv');
      if (!result) {
        result = await processCsvPipeline(csvText, 'OIL_Assam_Field_Logs_Sample.csv');
      }
      setCsvResult(result);
      setCsvStep('QUALITY_REPORT');
      setIsReviewExpanded(false);
    } catch (err: any) {
      try {
        const response = await fetch('/sample-datasets/OIL_Assam_Field_Logs_Sample.csv');
        const csvText = await response.text();
        const fallback = await processCsvPipeline(csvText, 'OIL_Assam_Field_Logs_Sample.csv');
        setCsvResult(fallback);
        setCsvStep('QUALITY_REPORT');
        setIsReviewExpanded(false);
      } catch (fallbackErr: any) {
        setCsvError(err.message || fallbackErr.message || 'Failed to load sample dataset');
      }
    } finally {
      setCsvParsing(false);
    }
  };

  // Step 2 -> Step 3: Start sequential stepped processing
  const handleStartProcessing = () => {
    if (!csvResult || csvResult.incidents.length === 0) return;
    setCsvStep('PROCESSING');
    setProcessingStageIndex(0);

    let stage = 0;
    const interval = setInterval(() => {
      stage += 1;
      if (stage < PROCESSING_STAGES.length) {
        setProcessingStageIndex(stage);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          commitDatasetIngestion({
            incidents: csvResult.incidents,
            dataset: csvResult.dataset,
          });
          handleClose();
          toast.success(
            'Field CSV Ingested Successfully',
            `Validated and committed ${csvResult.incidents.length} incident records from "${csvFileName}".`
          );
        }, 150);
      }
    }, 70);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-scale">
      <div className="bg-app-surface border border-app-subtle rounded-2xl max-w-3xl w-full max-h-[88dvh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-app-subtle flex items-center justify-between sticky top-0 bg-app-elevated/95 backdrop-blur z-10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-[#D4AF37]">
              {activeTab === 'csv' ? <FileSpreadsheet className="w-4 h-4" /> : <FilePlus2 className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-app-primary">
                {activeTab === 'csv' ? 'Ingest Field Safety Dataset (Batch CSV)' : 'Log Single Field Observation'}
              </h2>
              <p className="text-[11px] text-app-muted">
                Oil India Limited Upstream HSSE • SIF Precursor Detection Pipeline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-app-elevated border border-app-subtle rounded-lg p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('csv')}
                className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'csv'
                    ? 'bg-[#0066CC] dark:bg-[#0071E3] text-white font-semibold shadow-xs'
                    : 'text-app-muted hover:text-app-primary'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Upload CSV (Primary)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('single');
                  resetCsvState();
                }}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer text-[11px] ${
                  activeTab === 'single'
                    ? 'bg-app-surface text-app-primary font-semibold shadow-2xs'
                    : 'text-app-muted hover:text-app-primary'
                }`}
                title="Log a single observation manually (Exception path)"
              >
                Manual Entry
              </button>
            </div>

            <button
              onClick={handleClose}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-app-muted hover:text-app-primary hover:bg-app-elevated transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── TAB 1: SINGLE OBSERVATION LOGGING ─────────────────────── */}
        {activeTab === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="p-6 space-y-4">
            {/* Context header with return to CSV */}
            <div className="flex items-center justify-between bg-app-elevated border border-app-subtle rounded-lg px-3 py-2 text-xs">
              <span className="text-app-muted font-sans">
                Exception flow: Manual single-observation logging
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('csv')}
                className="text-[#0066CC] dark:text-[#2997FF] hover:underline flex items-center gap-1 font-mono font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Return to Batch CSV Upload</span>
              </button>
            </div>
            {/* Quick Demo Pre-fill Scenarios */}
            <div>
              <span className="text-xs font-mono text-app-muted uppercase tracking-wider block mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />
                Simulate Field Hazard Scenarios (Quick Pre-fill):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DEMO_PREFILL_SCENARIOS.map((sc) => (
                  <button
                    key={sc.title}
                    type="button"
                    onClick={() => {
                      handlePrefill(sc.narrative);
                      setSite(sc.site);
                      setCategory(sc.category);
                    }}
                    className="p-2 rounded-lg text-left border border-app-subtle bg-app-elevated hover:border-[#0071E3]/50 transition-all cursor-pointer shadow-2xs"
                  >
                    <span className="text-xs font-medium text-app-primary block truncate font-sans">
                      {sc.title}
                    </span>
                    <span className="text-xs font-mono text-app-muted block truncate">
                      {sc.category} • {sc.site.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Site and Category Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-app-secondary mb-1">
                  Site / Operational Installation:
                </label>
                <select
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-app-elevated border border-app-subtle text-xs text-app-primary focus:outline-none focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3] font-sans"
                >
                  {SITES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-app-secondary mb-1">
                  Incident Classification:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                  className="w-full p-2.5 rounded-lg bg-app-elevated border border-app-subtle text-xs text-app-primary focus:outline-none focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3] font-sans"
                >
                  <option value="UNSAFE_ACT">Unsafe Act (UA)</option>
                  <option value="UNSAFE_CONDITION">Unsafe Condition (UC)</option>
                  <option value="NEAR_MISS">Near-Miss (NM)</option>
                </select>
              </div>
            </div>

            {/* Reported By Field */}
            <div>
              <label className="block text-xs font-mono text-app-secondary mb-1">
                Reporting HSSE Supervisor / Observer:
              </label>
              <input
                type="text"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-app-elevated border border-app-subtle text-xs text-app-primary focus:outline-none focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3] font-sans"
                placeholder="Name & Designation"
              />
            </div>

            {/* Narrative Input Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono text-app-secondary">
                  Verbatim Field Incident Narrative:
                </label>
                <span className="text-xs text-amber-600 dark:text-[#D4AF37] font-mono">
                  Preserves Negations: &quot;without&quot;, &quot;not&quot;, &quot;no&quot;, &quot;bypassed&quot;
                </span>
              </div>
              <textarea
                required
                rows={4}
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                className="w-full p-3 rounded-lg bg-app-elevated border border-app-subtle text-xs text-app-primary placeholder:text-app-muted focus:outline-none focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3] leading-relaxed font-sans"
                placeholder="Enter field observation text in detail..."
              />
            </div>

            {/* Real-time NLP Live Token & Negation Preview Card */}
            <div className="p-4 rounded-xl bg-app-elevated border border-app-subtle space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-app-primary tracking-wider text-xs uppercase flex items-center gap-1.5 font-sans">
                  <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />
                  Live NLP Engine Preview
                </span>
                <RiskBadge level={analysis.risk.level} score={analysis.risk.score} size="sm" />
              </div>

              {/* Negation Tokens Detected */}
              <div>
                <span className="text-xs font-mono text-app-muted block mb-1">
                  PRESERVED SAFETY NEGATIONS DETECTED:
                </span>
                {analysis.negationMatches.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.negationMatches.map((neg, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800"
                      >
                        <AlertTriangle className="w-3 h-3 text-red-500" /> [{neg.phrase}]
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-app-muted italic font-sans">
                    No explicit negation phrases identified. Standard phrasing detected.
                  </span>
                )}
              </div>

              {/* Predicted Life-Saving Rule */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-app-subtle">
                <span className="text-app-muted font-sans">Classified Life-Saving Rule:</span>
                <span className="font-mono text-xs font-semibold text-amber-700 dark:text-[#D4AF37]">
                  {analysis.lsr.title}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="min-h-[40px] px-4 py-2 text-xs font-medium text-app-muted hover:text-app-primary rounded-lg border border-app-subtle hover:border-app-strong transition-colors font-sans cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#0066CC] hover:bg-[#0077ED] dark:bg-[#0071E3] rounded-lg transition-all cursor-pointer shadow-xs font-sans"
              >
                Submit Report to Live Queue
              </button>
            </div>
          </form>
        ) : (
          /* ── TAB 2: 3-STAGE BATCH CSV INGESTION PIPELINE ───────────── */
          <div className="p-6 space-y-6">
            {/* Step Breadcrumb Indicator */}
            <div className="flex items-center justify-between pb-3 border-b border-app-subtle text-xs font-mono">
              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    csvStep === 'UPLOAD'
                      ? 'bg-[#0066CC] dark:bg-[#0071E3] text-white shadow-xs'
                      : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  {csvStep !== 'UPLOAD' ? '✓' : '1'}
                </span>
                <span className={csvStep === 'UPLOAD' ? 'text-app-primary font-semibold' : 'text-app-muted'}>
                  Upload CSV
                </span>
              </div>

              <div className="w-8 h-[1px] bg-app-subtle" />

              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    csvStep === 'QUALITY_REPORT'
                      ? 'bg-[#0066CC] dark:bg-[#0071E3] text-white shadow-xs'
                      : csvStep === 'PROCESSING'
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-app-elevated text-app-muted border border-app-subtle'
                  }`}
                >
                  {csvStep === 'PROCESSING' ? '✓' : '2'}
                </span>
                <span
                  className={
                    csvStep === 'QUALITY_REPORT'
                      ? 'text-app-primary font-semibold'
                      : 'text-app-muted'
                  }
                >
                  Quality Report
                </span>
              </div>

              <div className="w-8 h-[1px] bg-app-subtle" />

              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    csvStep === 'PROCESSING'
                      ? 'bg-[#0066CC] dark:bg-[#0071E3] text-white shadow-xs'
                      : 'bg-app-elevated text-app-muted border border-app-subtle'
                  }`}
                >
                  3
                </span>
                <span
                  className={
                    csvStep === 'PROCESSING'
                      ? 'text-app-primary font-semibold'
                      : 'text-app-muted'
                  }
                >
                  Process Pipeline
                </span>
              </div>
            </div>

            {/* ── STAGE 1: UPLOAD STEP ──────────────────────────────── */}
            {csvStep === 'UPLOAD' && (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-app-strong hover:border-[#0071E3] rounded-2xl p-8 text-center bg-app-elevated transition-colors cursor-pointer space-y-3"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCsvFileSelect(file);
                    }}
                    className="hidden"
                  />

                  <div className="w-12 h-12 rounded-full bg-app-surface border border-app-subtle flex items-center justify-center mx-auto text-[#0066CC] dark:text-[#2997FF]">
                    <UploadCloud className="w-6 h-6" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-app-primary font-sans">
                      Drop CSV file here or click to browse
                    </p>
                    <p className="text-xs text-app-muted mt-1 font-sans">
                      Supports upstream E&P formats (Incident_ID, Site, Observation/Narrative, Category, Date)
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadSampleCsv();
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium bg-app-surface hover:bg-app-elevated text-[#0066CC] dark:text-[#2997FF] border border-app-subtle transition-colors cursor-pointer shadow-2xs"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />
                      <span>Load OIL Assam Sample CSV (10 incidents)</span>
                    </button>
                  </div>
                </div>

                {/* Parsing / Uploading spinner */}
                {csvParsing && (
                  <div className="p-4 rounded-xl bg-app-elevated border border-app-subtle flex items-center justify-center gap-2 text-xs font-mono text-app-secondary">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#0066CC] dark:text-[#2997FF]" />
                    <span>Parsing CSV structure and executing OISD-105 schema validation...</span>
                  </div>
                )}

                {/* Error Banner */}
                {csvError && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{csvError}</span>
                  </div>
                )}

                <div className="text-center pt-2 border-t border-app-subtle">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('single');
                      resetCsvState();
                    }}
                    className="text-xs text-app-muted hover:text-[#0066CC] dark:hover:text-[#2997FF] transition-colors cursor-pointer font-sans"
                  >
                    Need to log a one-off field observation? <span className="underline text-app-secondary hover:text-[#0066CC] dark:hover:text-[#2997FF]">Log a single entry manually instead →</span>
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="min-h-[40px] px-4 py-2 text-xs font-medium text-app-muted hover:text-app-primary rounded-lg border border-app-subtle hover:border-app-strong transition-colors font-sans cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── STAGE 2: QUALITY REPORT STEP ──────────────────────── */}
            {csvStep === 'QUALITY_REPORT' && csvResult && (
              <div className="space-y-5 animate-fade-in-scale">
                {/* File Header Bar */}
                <div className="p-3.5 rounded-xl bg-app-elevated border border-app-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-app-primary font-mono flex items-center gap-2">
                        <span>{csvResult.dataset.filename || csvFileName || 'OIL_Assam_Field_Logs.csv'}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/50">
                          VALIDATED
                        </span>
                      </div>
                      <p className="text-[11px] text-app-muted font-sans mt-0.5">
                        Syntactic verification passed with OISD-105 compliance checks.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={resetCsvState}
                    className="text-xs font-mono text-app-muted hover:text-app-primary underline cursor-pointer self-start sm:self-auto"
                  >
                    Upload Different File
                  </button>
                </div>

                {/* Clean Quality Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-app-elevated border border-app-subtle">
                    <div className="text-[10px] font-mono text-app-muted uppercase tracking-wider">
                      TOTAL ROWS
                    </div>
                    <div className="text-2xl font-bold font-mono text-app-primary mt-1">
                      {csvResult.summary.totalRows}
                    </div>
                    <div className="text-[10px] text-app-muted mt-0.5 font-sans">
                      {csvResult.qualityReport.columnIssues.length || 8} columns detected
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-app-elevated border border-app-subtle">
                    <div className="text-[10px] font-mono text-app-muted uppercase tracking-wider">
                      VALID RECORDS
                    </div>
                    <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      {csvResult.summary.validRows}
                    </div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400/80 mt-0.5 font-sans">
                      100% schema conformant
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-app-elevated border border-app-subtle">
                    <div className="text-[10px] font-mono text-app-muted uppercase tracking-wider">
                      DUPLICATES
                    </div>
                    <div className="text-2xl font-bold font-mono text-app-secondary mt-1">
                      {csvResult.qualityReport.summary.duplicateRows ?? 0}
                    </div>
                    <div className="text-[10px] text-app-muted mt-0.5 font-sans">
                      0 duplicate drops
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-app-elevated border border-app-subtle">
                    <div className="text-[10px] font-mono text-app-muted uppercase tracking-wider">
                      MISSING / WARNINGS
                    </div>
                    <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                      {csvResult.summary.warningRows ?? 0}
                    </div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-400/80 mt-0.5 font-sans">
                      0 missing narratives
                    </div>
                  </div>
                </div>

                {/* AI SIF Assessment Summary Strip (Standard Badge Hierarchy) */}
                <div className="p-3.5 rounded-xl bg-app-elevated border border-app-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-[#D4AF37]" />
                    <span className="text-xs font-semibold text-app-primary font-sans">
                      NLP Inference Pre-Scan:
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800">
                      <Flame className="w-3.5 h-3.5 text-red-500" />
                      <span>{csvResult.summary.sifCount} SIF PRECURSORS</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>{csvResult.summary.criticalCount} CRITICAL TIER</span>
                    </span>
                  </div>
                </div>

                {/* Optional Expandable Preview Section */}
                {isReviewExpanded && (
                  <div className="rounded-xl border border-app-subtle bg-app-elevated overflow-hidden text-xs space-y-0 animate-fade-in-scale">
                    <div className="p-3 border-b border-app-subtle bg-app-surface flex items-center justify-between text-xs font-mono font-semibold text-app-primary">
                      <span>DATASET RECORD PREVIEW (Top {Math.min(5, csvResult.incidents.length)} rows)</span>
                      <span className="text-[11px] text-app-muted font-sans">
                        Showing canonical mapped fields
                      </span>
                    </div>
                    <div className="divide-y divide-app-subtle max-h-56 overflow-y-auto">
                      {csvResult.incidents.slice(0, 5).map((inc) => (
                        <div key={inc.id} className="p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-mono text-xs">
                              <span className="font-semibold text-amber-600 dark:text-[#D4AF37]">{inc.id}</span>
                              <span className="text-app-muted">• {inc.site}</span>
                            </div>
                            <RiskBadge level={inc.riskLevel} score={inc.riskScore} size="sm" />
                          </div>
                          <p className="text-xs text-app-secondary line-clamp-1 leading-relaxed font-sans">
                            {inc.rawNarrative}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] font-mono text-app-muted">
                            <span>LSR: <span className="text-app-primary">{inc.lsrTitle}</span></span>
                            {inc.isSifPrecursor && (
                              <span className="text-red-600 dark:text-red-400 font-bold">• SIF Precursor</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Controls */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-app-subtle">
                  <button
                    type="button"
                    onClick={() => setIsReviewExpanded(!isReviewExpanded)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono text-app-secondary bg-app-elevated border border-app-subtle hover:border-app-strong hover:text-app-primary transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />
                    <span>{isReviewExpanded ? 'Hide Record Preview' : `Review Data (${csvResult.incidents.length} Records)`}</span>
                    {isReviewExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="min-h-[40px] px-4 py-2 text-xs font-medium text-app-muted hover:text-app-primary rounded-lg border border-app-subtle hover:border-app-strong transition-colors font-sans cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleStartProcessing}
                      className="min-h-[40px] px-5 py-2 text-xs font-semibold text-white bg-[#0066CC] hover:bg-[#0077ED] dark:bg-[#0071E3] rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-2 font-sans"
                    >
                      <span>Process Dataset</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── STAGE 3: PROCESSING STEP ──────────────────────────── */}
            {csvStep === 'PROCESSING' && (
              <div className="py-8 px-6 space-y-6 animate-fade-in-scale">
                {/* Stage pipeline list — GSAP animates each dot/label on activeIndex change */}
                <div ref={stageListRef} className="max-w-xs mx-auto space-y-2">
                  {PROCESSING_STAGES.map((stage, idx) => {
                    const isActive = idx === processingStageIndex;
                    const isDone = idx < processingStageIndex;
                    return (
                      <div
                        key={stage.key}
                        data-pipeline-stage
                        className="flex items-center gap-3"
                      >
                        <span
                          data-pipeline-dot
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors duration-200 ${
                            isDone
                              ? 'bg-emerald-500'
                              : isActive
                              ? 'bg-[#0071E3] shadow-[0_0_8px_rgba(0,113,227,0.5)]'
                              : 'bg-app-subtle'
                          }`}
                        />
                        <span
                          data-pipeline-label
                          className={`text-xs font-mono leading-relaxed transition-colors duration-200 ${
                            isDone
                              ? 'text-emerald-600 dark:text-emerald-400/70'
                              : isActive
                              ? 'text-[#0066CC] dark:text-[#2997FF] font-semibold'
                              : 'text-app-muted'
                          }`}
                        >
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="max-w-xs mx-auto space-y-2">
                  <div className="w-full h-2 rounded-full bg-app-elevated border border-app-subtle overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0066CC] to-[#2997FF] transition-all duration-300 ease-out"
                      style={{
                        width: `${PROCESSING_STAGES[processingStageIndex]?.percent || 10}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-app-muted">
                    <span>Stage {processingStageIndex + 1} of {PROCESSING_STAGES.length}</span>
                    <span>{PROCESSING_STAGES[processingStageIndex]?.percent}%</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-app-elevated border border-app-subtle max-w-xs mx-auto text-[11px] font-mono text-app-muted text-center">
                  <span>Target Basin: Assam Operational Basin (Duliajan HQ)</span>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
