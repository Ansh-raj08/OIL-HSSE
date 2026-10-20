// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// API Contract Types (Phase 2+ Preparation)
// ============================================================
//
// These types define the request/response shapes for the REST API
// that will be implemented in Phase 7 (Python backend).
//
// DESIGN PRINCIPLE: Define the contract BEFORE building the backend.
// This allows the frontend to be developed against mock implementations
// of these contracts, then swap to real API calls with zero type changes.
// ============================================================

import type {
  SafetyIncident,
  Dataset,
  DataQualityReport,
  ProcessingJob,
  RiskLevel,
  IncidentCategory,
  ValidationStatus,
  AuthSession,
} from './safety';

// ── Authentication ──────────────────────────────────────────

export interface LoginRequest {
  /** Demo mode: just the role to assume */
  role: 'ADMIN' | 'USER';
  name?: string;
}

export interface LoginResponse {
  session: AuthSession;
}

// ── Incidents ───────────────────────────────────────────────

export interface GetIncidentsRequest {
  datasetId?: string;
  riskLevel?: RiskLevel;
  category?: IncidentCategory;
  status?: ValidationStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface GetIncidentsResponse {
  incidents: SafetyIncident[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ConfirmIncidentRequest {
  incidentId: string;
  reviewedBy: string;
  escalationNotes?: string;
}

export interface OverrideIncidentRequest {
  incidentId: string;
  reviewedBy: string;
  justification: string;
}

// ── Datasets ────────────────────────────────────────────────

export interface UploadDatasetRequest {
  file: File;
  uploadedBy: string;
}

export interface UploadDatasetResponse {
  dataset: Dataset;
  jobId: string;
}

export interface GetDatasetsResponse {
  datasets: Dataset[];
}

export interface GetDataQualityReportResponse {
  report: DataQualityReport;
}

// ── Processing ──────────────────────────────────────────────

export interface GetProcessingJobResponse {
  job: ProcessingJob;
}

// ── KPI / Analytics ─────────────────────────────────────────

export interface KPISummary {
  totalIngested: number;
  flaggedSif: number;
  pendingReview: number;
  complianceRate: number;
}

export interface GetKPISummaryResponse {
  kpi: KPISummary;
}

export interface RiskDistribution {
  level: RiskLevel;
  count: number;
  percentage: number;
}

export interface GetAnalyticsResponse {
  riskDistribution: RiskDistribution[];
  incidentsByCategory: { category: IncidentCategory; count: number }[];
  incidentsBySite: { site: string; count: number }[];
  sifTrend: { date: string; count: number }[];
}
