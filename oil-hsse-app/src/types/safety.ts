// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Strict TypeScript Interfaces (Prompt v2.0 - SIH26165)
// ============================================================

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

// Backward-compatible alias
export type RiskTier = RiskLevel;

export type ValidationStatus = 'PENDING' | 'CONFIRMED' | 'OVERRIDDEN';

// Backward-compatible alias
export type ReportStatus = 'PENDING_REVIEW' | 'CONFIRMED_SIF' | 'ESCALATED' | 'OVERRIDDEN' | 'CLOSED';

export type IncidentCategory = 'UNSAFE_ACT' | 'UNSAFE_CONDITION' | 'NEAR_MISS';

export type LSRCode =
  | 'LSR-01' // Energy Isolation / LOTO
  | 'LSR-02' // Confined Space Entry
  | 'LSR-03' // Working at Height
  | 'LSR-04' // Hot Work
  | 'LSR-05' // Driving / Vehicle Safety
  | 'LSR-06' // Dropped Objects
  | 'LSR-07' // Hydrogen Sulphide (H2S) / Toxic Gas
  | 'LSR-08' // Fire & Explosive Atmosphere
  | 'LSR-09'; // Mechanical Lifting Operations

export interface LSRViolation {
  code: LSRCode;
  label: string;
  description: string;
}

export interface XAITrigger {
  token: string;
  weight: number; // 0-1 contribution to SIF score
  context: string; // surrounding clause
  isNegation: boolean; // e.g., "without safety harness" = true
}

export type ControlLevel = 'ELIMINATION' | 'SUBSTITUTION' | 'ENGINEERING' | 'ADMINISTRATIVE' | 'PPE';

export interface HierarchyAction {
  order: number;
  level: ControlLevel;
  action: string;
  urgency: 'IMMEDIATE' | 'SHORT_TERM' | 'LONG_TERM';
}

export type EscalationTier = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';

export interface EscalationFactor {
  factor: string;
  weight: number;
  description: string;
}

export interface EscalationLikelihood {
  score: number; // 0 - 100 heuristic score
  tier: EscalationTier;
  factors: EscalationFactor[];
  summary: string;
}

export interface SafetyIncident {
  id: string; // e.g. "OIL-2026-1042"
  timestamp: string; // ISO or formatted date
  site: string; // e.g. "Duliajan Rig #7"
  basin: string; // e.g. "Assam Operational Basin"
  reportedBy: string; // e.g. "P. Phukan (Rig Supt.)"
  category: IncidentCategory;
  rawNarrative: string;
  truncatedNarrative: string;
  riskScore: number; // 0-100 deterministic score
  riskLevel: RiskLevel;
  isSifPrecursor: boolean;
  lsrCategory: LSRCode;
  lsrTitle: string;
  lsrViolations: LSRViolation[];
  xaiTriggers: XAITrigger[];
  hierarchyActions: HierarchyAction[];
  validationStatus: ValidationStatus;
  escalationLikelihood?: EscalationLikelihood;
  reviewedBy?: string;
  reviewedAt?: string;
  overrideJustification?: string;
  escalationNotes?: string;
  datasetId?: string;
}

// Backward-compatible alias for existing imports
export type SafetyReport = SafetyIncident;

export interface KpiMetrics {
  totalIngested: number;
  flaggedSif: number;
  pendingReview: number;
  complianceRate: number; // percentage 0-100
}

export type TriageFilter = 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'PENDING REVIEW';

export interface SafetyContextType {
  incidents: SafetyIncident[];
  selectedIncident: SafetyIncident | null;
  filter: TriageFilter;
  searchQuery: string;
  kpiMetrics: KpiMetrics;
  isIngestionModalOpen: boolean;
  isOverrideModalOpen: boolean;
  datasets: Dataset[];
  isLoading: boolean;
  setFilter: (filter: TriageFilter) => void;
  setSearchQuery: (query: string) => void;
  selectIncident: (incident: SafetyIncident | null) => void;
  confirmAndEscalate: (incidentId: string, officerName?: string, notes?: string) => void;
  overrideIncident: (incidentId: string, justification: string, officerName?: string) => void;
  addIncident: (incident: Omit<SafetyIncident, 'id' | 'timestamp' | 'validationStatus'>) => void;
  addBatchIncidents: (incidents: SafetyIncident[]) => void;
  commitDatasetIngestion: (payload: { incidents: SafetyIncident[]; dataset?: Dataset }) => void;
  addDataset: (dataset: Dataset) => void;
  removeDataset: (datasetId: string) => void;
  refreshDatasets: () => Promise<void>;
  removeDatasetIncidents: (datasetId: string) => void;
  openIngestionModal: () => void;
  closeIngestionModal: () => void;
  openOverrideModal: () => void;
  closeOverrideModal: () => void;
}

// 9 IOGP / OIL Life-Saving Rules Dictionary
export const LSR_DICTIONARY: Record<LSRCode, { code: LSRCode; title: string; category: string; description: string }> = {
  'LSR-01': {
    code: 'LSR-01',
    title: 'Energy Isolation / LOTO',
    category: 'Process Safety',
    description: 'Verify isolation and zero energy state before work begins. Lockout/Tagout mandatory.',
  },
  'LSR-02': {
    code: 'LSR-02',
    title: 'Confined Space Entry',
    category: 'Occupational Safety',
    description: 'Obtain authorization, verify continuous gas monitoring, and confirm standby person present.',
  },
  'LSR-03': {
    code: 'LSR-03',
    title: 'Working at Height',
    category: 'Fall Protection',
    description: 'Protect yourself against a fall when working above 1.8 meters with 100% tie-off.',
  },
  'LSR-04': {
    code: 'LSR-04',
    title: 'Hot Work',
    category: 'Fire & Explosion',
    description: 'Identify and control flammables. Obtain hot work permit and gas test before ignition.',
  },
  'LSR-05': {
    code: 'LSR-05',
    title: 'Driving & Vehicle Safety',
    category: 'Transport Safety',
    description: 'Always wear seatbelt, obey speed limits, and never use mobile phone while driving.',
  },
  'LSR-06': {
    code: 'LSR-06',
    title: 'Line of Fire & Dropped Objects',
    category: 'Physical Barriers',
    description: 'Keep yourself and others out of the line of fire and drop-hazard exclusion zones.',
  },
  'LSR-07': {
    code: 'LSR-07',
    title: 'H₂S / Toxic Gas Exposure',
    category: 'Chemical Hazards',
    description: 'Wear calibrated personal H₂S monitor and carry emergency escape breathing apparatus (EEBA).',
  },
  'LSR-08': {
    code: 'LSR-08',
    title: 'Bypassing Safety Controls',
    category: 'Barrier Management',
    description: 'Obtain authorization before overriding, inhibiting, or disabling any safety interlock.',
  },
  'LSR-09': {
    code: 'LSR-09',
    title: 'Mechanical Lifting Operations',
    category: 'Rigging Safety',
    description: 'Plan lifting operations, inspect rigging gear, and never walk under a suspended load.',
  },
};

// ============================================================
// Phase 2+ Types — Authentication, Datasets, Processing
// ============================================================

/** User roles for role-based access control (Admin & User only) */
export type UserRole = 'ADMIN' | 'USER';

/** Minimal session representation for demo auth */
export interface AuthSession {
  id: string;
  name: string;
  role: UserRole;
  /** e.g. "Assam Operational Basin" */
  basin?: string;
}

/** Status of a dataset lifecycle */
export type DatasetStatus =
  | 'UPLOADING'
  | 'VALIDATING'
  | 'CLEANING'
  | 'ANALYZING'
  | 'READY'
  | 'ERROR';

/** A CSV dataset that has been uploaded for processing */
export interface Dataset {
  id: string;
  filename: string;
  uploadedAt: string;
  uploadedBy: string;
  status: DatasetStatus;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warningRows: number;
  /** Processing error message, if any */
  errorMessage?: string;
}

/** Quality report for a processed dataset */
export interface DataQualityReport {
  datasetId: string;
  generatedAt: string;
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    warningRows: number;
    duplicateRows: number;
  };
  /** Column-level quality metrics */
  columnIssues: {
    column: string;
    missingCount: number;
    invalidCount: number;
    sampleIssues: string[];
  }[];
}

/** Represents a batch processing job (CSV → SafetyIncident[]) */
export interface ProcessingJob {
  id: string;
  datasetId: string;
  startedAt: string;
  completedAt?: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  processedCount: number;
  totalCount: number;
  errorMessage?: string;
}

export interface IngestIncidentRequest {
  site: string;
  category: IncidentCategory;
  reportedBy: string;
  rawNarrative: string;
  basin?: string;
}

export interface CsvPipelineResult {
  dataset: Dataset;
  incidents: SafetyIncident[];
  qualityReport: DataQualityReport;
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    warningRows: number;
    sifCount: number;
    criticalCount: number;
  };
}

