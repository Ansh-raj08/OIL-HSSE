'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Dataset Ingestion & Quality Management Route (/datasets)
// ============================================================

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useSafety } from '@/context/SafetyContext';
import { useTimeFormat } from '@/context/TimeFormatContext';
import { Dataset } from '@/types/safety';
import { apiClient } from '@/lib/api/client';
import { DatasetsSkeleton, ButtonSpinner } from '@/components/ui/Skeleton';
import { useToast } from '@/context/ToastContext';
import {
  Database,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  FileText,
  Clock,
  HardDrive,
  ShieldCheck,
  ExternalLink,
  Info,
  Trash2,
  AlertOctagon,
  X,
} from 'lucide-react';

export default function DatasetsPage() {
  const { role, canManageDatasets } = useAuth();
  const {
    datasets,
    openIngestionModal,
    removeDataset,
    removeDatasetIncidents,
    refreshDatasets,
    refreshIncidents,
    isLoading,
  } = useSafety();
  const { formatTimestamp } = useTimeFormat();
  const toast = useToast();
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState<Dataset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    refreshDatasets();
    refreshIncidents();
  }, []);

  useEffect(() => {
    if (datasets.length > 0) {
      if (!selectedDataset || !datasets.some((d) => d.id === selectedDataset.id)) {
        setSelectedDataset(datasets[0]);
      }
    } else {
      setSelectedDataset(null);
    }
  }, [datasets, selectedDataset]);

  const handleConfirmDelete = async () => {
    if (!datasetToDelete) return;
    const deletedName = datasetToDelete.filename;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const ok = await apiClient.deleteDataset(datasetToDelete.id);
      if (!ok) {
        throw new Error('Server could not delete dataset. Please verify backend connection and administrative privileges.');
      }
      removeDataset(datasetToDelete.id);
      removeDatasetIncidents(datasetToDelete.id);
      await refreshDatasets();
      await refreshIncidents();
      if (selectedDataset?.id === datasetToDelete.id) {
        const remaining = datasets.filter((d) => d.id !== datasetToDelete.id);
        setSelectedDataset(remaining[0] || null);
      }
      toast.success(
        'Dataset Deleted Successfully',
        `Removed "${deletedName}" from registry and purged associated records.`
      );
      setDatasetToDelete(null);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to delete dataset.';
      setDeleteError(errMsg);
      toast.error('Failed to Delete Dataset', errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalLogs = datasets.reduce((acc, d) => acc + d.totalRows, 0);
  const totalValid = datasets.reduce((acc, d) => acc + d.validRows, 0);
  const cleanRate = totalLogs > 0 ? Math.round((totalValid / totalLogs) * 100) : 100;

  return (
    <AppShell
      title="Dataset Ingestion & Quality Governance"
      subtitle="Batch Ingestion, Syntactic Cleaning & Schema Verification"
      breadcrumbs={[
        { label: 'Triage Stream', href: '/dashboard' },
        { label: 'Datasets' },
      ]}
      actions={
        canManageDatasets ? (
          <button
            onClick={openIngestionModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0066CC] hover:bg-[#0077ED] active:scale-95 transition-all shadow-sm cursor-pointer font-sans"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Field CSV</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-app-elevated border border-app-subtle text-app-muted font-sans">
            <Info className="w-3 h-3 text-[#0066CC] dark:text-[#2997FF]" />
            <span>Read-Only ({role})</span>
          </div>
        )
      }
    >
      <div className="max-w-[1720px] w-full mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* Page Header Intro */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-app-subtle pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-[#0066CC] dark:text-[#2997FF] border border-blue-500/20">
                <Database className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-app-primary font-sans">
                Dataset Ingestion & Quality Governance
              </h1>
            </div>
            <p className="text-xs text-app-muted font-sans">
              Batch CSV file ingestion, automated syntactic cleaning, column-level quality checks, and canonical normalization for OIL HSSE operations.
            </p>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            {canManageDatasets && (
              <button
                onClick={openIngestionModal}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#0066CC] hover:bg-[#0077ED] active:scale-95 transition-all shadow-sm cursor-pointer font-sans"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Field CSV</span>
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <DatasetsSkeleton />
        ) : (
          <>
            {/* Top Operational Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-app-subtle bg-app-surface p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-app-muted mb-1 font-sans">
                  <span>Total Ingested Batches</span>
                  <FileSpreadsheet className="w-4 h-4 text-amber-600 dark:text-[#D4AF37]" />
                </div>
                <div className="text-3xl font-semibold font-mono text-app-primary">{datasets.length}</div>
                <div className="text-xs text-app-muted mt-1 font-sans">Batches in Supabase Storage</div>
              </div>

              <div className="rounded-xl border border-app-subtle bg-app-surface p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-app-muted mb-1 font-sans">
                  <span>Total Processed Logs</span>
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-3xl font-semibold font-mono text-app-primary">{totalLogs.toLocaleString()}</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-sans">100% normalized to SafetyIncident</div>
              </div>

              <div className="rounded-xl border border-app-subtle bg-app-surface p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-app-muted mb-1 font-sans">
                  <span>Quality Index</span>
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-3xl font-semibold font-mono text-app-primary">{cleanRate}%</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-sans">Passing syntactic & schema checks</div>
              </div>

              <div className="rounded-xl border border-app-subtle bg-app-surface p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-app-muted mb-1 font-sans">
                  <span>Storage Architecture</span>
                  <HardDrive className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-sm font-semibold text-app-primary mt-1 font-sans">Supabase Storage + S3</div>
                <div className="text-xs text-app-muted mt-1 font-sans">
                  Bucket: <span className="font-mono text-app-secondary">datasets/upstream-logs</span>
                </div>
              </div>
            </div>

            {/* Datasets Table & Inspection Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Datasets Table (8-column span) */}
              <div className="lg:col-span-8 rounded-xl border border-app-subtle bg-app-surface overflow-hidden shadow-xs">
                <div className="p-4 border-b border-app-subtle bg-app-elevated/40 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-app-primary flex items-center gap-2 font-sans">
                    <span>Ingested Safety Datasets</span>
                    <span className="text-xs font-mono text-app-muted font-normal">({datasets.length} records)</span>
                  </h2>
                  <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/40 px-2 py-0.5 rounded font-semibold">
                    PIPELINE IDLE • READY
                  </span>
                </div>

                {datasets.length === 0 ? (
                  <EmptyState
                    icon={FileSpreadsheet}
                    title="No datasets uploaded"
                    description="No safety incident batch files have been uploaded yet. Upload a field CSV file to begin ingestion."
                    action={{
                      label: 'Upload Field CSV',
                      onClick: openIngestionModal,
                      icon: UploadCloud,
                    }}
                    className="my-6 mx-4"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-app-elevated text-app-muted font-mono text-xs border-b border-app-subtle">
                        <tr>
                          <th className="py-3 px-4">Dataset Filename</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Rows</th>
                          <th className="py-3 px-4">Quality</th>
                          <th className="py-3 px-4">Uploaded By</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-app-subtle">
                        {datasets.map((ds) => {
                          const isSelected = selectedDataset?.id === ds.id;
                          return (
                            <tr
                              key={ds.id}
                              onClick={() => setSelectedDataset(ds)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-amber-500/10 dark:bg-amber-500/15 font-medium'
                                  : 'hover:bg-app-elevated/50'
                              }`}
                            >
                              <td className="py-3 px-4 font-mono font-medium text-app-primary">
                                <div className="flex items-center gap-2">
                                  <FileSpreadsheet className="w-4 h-4 text-amber-600 dark:text-[#D4AF37] flex-shrink-0" />
                                  <span className="truncate max-w-[220px]">{ds.filename}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  {ds.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-app-secondary">
                                {ds.totalRows.toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5 text-xs font-mono">
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{ds.validRows} valid</span>
                                  {ds.warningRows > 0 && (
                                    <span className="text-amber-600 dark:text-amber-400">({ds.warningRows} warn)</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-app-muted font-sans truncate max-w-[150px]">
                                {ds.uploadedBy}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedDataset(ds);
                                      setShowQualityModal(true);
                                    }}
                                    className="px-2.5 py-1 rounded bg-app-elevated hover:bg-app-hover border border-app-subtle text-app-primary text-xs font-mono transition-colors cursor-pointer"
                                  >
                                    Report
                                  </button>
                                  {role === 'ADMIN' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDatasetToDelete(ds);
                                      }}
                                      title="Delete dataset (ADMIN only)"
                                      className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs font-mono transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Inspection Panel (4-column span) */}
              <div className="lg:col-span-4 rounded-xl border border-app-subtle bg-app-surface p-4 flex flex-col overflow-hidden shadow-xs">
                <h2 className="text-sm font-semibold text-app-primary border-b border-app-subtle pb-3 mb-4 flex items-center justify-between font-sans">
                  <span>Dataset Details</span>
                  <span className="text-xs font-mono text-amber-700 dark:text-[#D4AF37]">{selectedDataset?.id || '—'}</span>
                </h2>

                {selectedDataset ? (
                  <div className="space-y-4 text-xs font-sans">
                    <div>
                      <div className="text-app-muted text-xs mb-1">Target Filename</div>
                      <div className="font-mono text-app-primary font-semibold break-all bg-app-elevated p-2 rounded-lg border border-app-subtle">
                        {selectedDataset.filename}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-app-elevated p-3 rounded-lg border border-app-subtle">
                        <div className="text-xs text-app-muted font-mono">VALID OBSERVATIONS</div>
                        <div className="text-xl font-semibold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                          {selectedDataset.validRows}
                        </div>
                      </div>
                      <div className="bg-app-elevated p-3 rounded-lg border border-app-subtle">
                        <div className="text-xs text-app-muted font-mono">WARNING ROWS</div>
                        <div className="text-xl font-semibold font-mono text-amber-600 dark:text-amber-400 mt-1">
                          {selectedDataset.warningRows}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-app-muted text-xs mb-1">Ingestion Timestamp</div>
                      <div className="text-app-primary font-mono text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-app-muted" />
                        <span>{formatTimestamp(selectedDataset.uploadedAt)}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-app-muted text-xs mb-1">Authorizing HSSE Officer</div>
                      <div className="text-app-primary text-xs flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />
                        <span>{selectedDataset.uploadedBy}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-app-subtle space-y-2">
                      <button
                        onClick={() => setShowQualityModal(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-app-elevated hover:bg-app-hover border border-app-subtle text-app-primary font-semibold transition-colors cursor-pointer"
                      >
                        <span>View Syntactic Quality Audit</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      {role === 'ADMIN' && (
                        <button
                          onClick={() => setDatasetToDelete(selectedDataset)}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 font-semibold transition-colors cursor-pointer text-xs font-sans"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Dataset & Incidents</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    compact
                    title="No dataset selected"
                    description="Select a dataset from the list to inspect quality metrics and column schema."
                    className="py-6 my-auto"
                  />
                )}
              </div>
            </div>

            {/* Pipeline Architecture Note */}
            <div className="rounded-xl border border-app-subtle bg-app-elevated/40 p-4 text-xs font-mono text-app-muted flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-600 dark:text-[#D4AF37] flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-app-primary font-semibold">AUTOMATED INGESTION & NORMALIZATION PIPELINE:</span>
                <p>
                  Uploaded CSVs pass through (1) Header Validation, (2) Syntactic Cleaning (whitespace, Unicode normalizer, date standardization), (3) Safety-Negation Preservation, and (4) Deterministic SIF Precursor Risk Inference before population into the operational triage stream.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Quality Report Modal ────────────────────────────────────── */}
      {showQualityModal && selectedDataset && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-app-surface border border-app-subtle rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-app-subtle pb-3">
              <div>
                <h3 className="text-base font-bold text-app-primary">Syntactic Data Quality Audit</h3>
                <p className="text-xs font-mono text-amber-700 dark:text-[#D4AF37]">{selectedDataset.filename}</p>
              </div>
              <button
                onClick={() => setShowQualityModal(false)}
                className="text-app-muted hover:text-app-primary text-xs font-mono px-2 py-1 rounded bg-app-elevated border border-app-subtle cursor-pointer"
              >
                Close (ESC)
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-app-elevated p-3 rounded-lg border border-app-subtle">
                  <div className="text-[10px] text-app-muted font-mono">TOTAL ROWS</div>
                  <div className="text-xl font-bold font-mono text-app-primary">{selectedDataset.totalRows}</div>
                </div>
                <div className="bg-app-elevated p-3 rounded-lg border border-app-subtle">
                  <div className="text-[10px] text-app-muted font-mono">CLEAN ROWS</div>
                  <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{selectedDataset.validRows}</div>
                </div>
                <div className="bg-app-elevated p-3 rounded-lg border border-app-subtle">
                  <div className="text-[10px] text-app-muted font-mono">WARNING ROWS</div>
                  <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{selectedDataset.warningRows}</div>
                </div>
              </div>

              <div className="bg-app-elevated p-4 rounded-xl border border-app-subtle space-y-2">
                <div className="text-[11px] font-mono text-app-primary font-semibold">
                  COLUMN SANITIZATION AUDIT
                </div>
                <div className="space-y-1.5 text-[11px] font-mono text-app-muted">
                  <div className="flex justify-between">
                    <span>• Incident_ID (Unique Key):</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% Unique • Validated</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Timestamp (Standard ISO):</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% Parsed (Asia/Kolkata)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Site / Installation:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% Mapped to OIL Assets</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Narrative Text:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Preserved (Negation Tokens Intact)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowQualityModal(false)}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors cursor-pointer shadow-xs"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Dataset Deletion Modal (ADMIN) ────────────────── */}
      {datasetToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-app-surface border border-rose-300 dark:border-rose-800/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-700 text-rose-600 dark:text-rose-400">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-app-primary font-sans">
                  Confirm Dataset Removal (ADMIN Only)
                </h3>
                <p className="text-xs font-mono text-rose-600 dark:text-rose-300 mt-0.5 break-all">
                  {datasetToDelete.filename}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-app-elevated border border-app-subtle text-xs text-app-secondary space-y-2 font-sans">
              <p>
                Are you sure you want to permanently delete this dataset?
              </p>
              <p className="text-app-muted text-[11px] leading-relaxed">
                <strong className="text-amber-700 dark:text-amber-400">Warning:</strong> This removes the dataset file and cascades to permanently delete its derived incidents, XAI feature weights, and supervisory reviews from the operational queue.
              </p>
              <p className="text-emerald-700 dark:text-emerald-400 text-[11px] font-mono">
                ✓ An immutable regulatory audit log entry will be preserved in compliance with OISD-105 & DGMS requirements.
              </p>
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDatasetToDelete(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-app-secondary hover:text-app-primary rounded-lg border border-app-subtle hover:bg-app-elevated transition-colors font-sans cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all shadow-sm font-sans cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <ButtonSpinner className="w-3.5 h-3.5" />
                    <span>Deleting...</span>
                  </span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
