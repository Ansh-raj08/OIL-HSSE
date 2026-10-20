# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# Pydantic Schemas matching src/types/api.ts & safety.ts
# ============================================================

from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel, Field

# Core Enums
RiskLevel = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
ValidationStatus = Literal["PENDING", "CONFIRMED", "OVERRIDDEN"]
IncidentCategory = Literal["UNSAFE_ACT", "UNSAFE_CONDITION", "NEAR_MISS"]
UserRole = Literal["ADMIN", "USER"]
ControlLevel = Literal["ELIMINATION", "SUBSTITUTION", "ENGINEERING", "ADMINISTRATIVE", "PPE"]

LSRCode = Literal[
    "LSR-01",  # Energy Isolation / LOTO
    "LSR-02",  # Confined Space Entry
    "LSR-03",  # Working at Height
    "LSR-04",  # Hot Work
    "LSR-05",  # Driving / Vehicle Safety
    "LSR-06",  # Line of Fire & Dropped Objects
    "LSR-07",  # Hydrogen Sulphide (H2S) / Toxic Gas
    "LSR-08",  # Bypassing Safety Controls
    "LSR-09",  # Mechanical Lifting Operations
]

# Analysis Models
class XAITrigger(BaseModel):
    token: str
    weight: float
    context: str
    isNegation: bool

class LSRViolation(BaseModel):
    code: str
    label: str
    description: str

class HierarchyAction(BaseModel):
    order: int
    level: ControlLevel
    action: str
    urgency: Literal["IMMEDIATE", "SHORT_TERM", "LONG_TERM"]

class LSRClassificationModel(BaseModel):
    code: str
    title: str
    matchType: Literal["RULE_MATCHED", "DEFAULT"]
    matchedCategory: str
    secondaryMatches: Optional[List[Dict[str, str]]] = None

class RiskAssessmentModel(BaseModel):
    score: int
    level: RiskLevel
    isSifPrecursor: bool
    negationMatches: List[Dict[str, Any]]
    highEnergyModifiers: List[str]
    hazardScore: int
    negationScore: int
    highEnergyScore: int

# Escalation Likelihood Models
EscalationTier = Literal["LOW", "MODERATE", "HIGH", "SEVERE"]

class EscalationFactorModel(BaseModel):
    factor: str
    weight: int
    description: str

class EscalationLikelihoodModel(BaseModel):
    score: int
    tier: EscalationTier
    factors: List[EscalationFactorModel] = []
    summary: str

# Safety Incident
class SafetyIncident(BaseModel):
    id: str
    timestamp: str
    site: str
    basin: str = "Assam Operational Basin"
    reportedBy: str
    category: IncidentCategory
    rawNarrative: str
    truncatedNarrative: str
    riskScore: int
    riskLevel: RiskLevel
    isSifPrecursor: bool
    lsrCategory: str
    lsrTitle: str
    validationStatus: ValidationStatus = "PENDING"
    lsrViolations: List[LSRViolation] = []
    xaiTriggers: List[XAITrigger] = []
    hierarchyActions: List[HierarchyAction] = []
    escalationLikelihood: Optional[EscalationLikelihoodModel] = None
    reviewedBy: Optional[str] = None
    reviewedAt: Optional[str] = None
    escalationNotes: Optional[str] = None
    overrideJustification: Optional[str] = None
    datasetId: Optional[str] = None

# Dataset & Quality Models
class Dataset(BaseModel):
    id: str
    filename: str
    uploadedAt: str
    uploadedBy: str
    status: Literal["READY", "PROCESSING", "ERROR"]
    totalRows: int
    validRows: int
    invalidRows: int
    warningRows: int

class ColumnIssue(BaseModel):
    column: str
    missingCount: int = 0
    invalidCount: int = 0
    sampleIssues: List[str] = []

class QualitySummary(BaseModel):
    totalRows: int
    validRows: int
    invalidRows: int
    warningRows: int
    duplicateRows: int = 0

class DataQualityReport(BaseModel):
    datasetId: str
    generatedAt: Optional[str] = None
    filename: Optional[str] = None
    totalRows: Optional[int] = None
    validRows: Optional[int] = None
    invalidRows: Optional[int] = None
    warningRows: Optional[int] = None
    encodingAudit: str = "UTF-8 Standard Compliant"
    negationsPreserved: int = 0
    cleanRate: int = 100
    summary: Optional[QualitySummary] = None
    columnIssues: List[ColumnIssue] = []

class PipelineSummary(BaseModel):
    totalRows: int
    validRows: int
    invalidRows: int
    warningRows: int
    sifCount: int
    criticalCount: int

class CsvPipelineResult(BaseModel):
    dataset: Dataset
    incidents: List[SafetyIncident]
    qualityReport: DataQualityReport
    summary: PipelineSummary

# Auth Models
class LoginRequest(BaseModel):
    role: UserRole
    name: Optional[str] = None

class AuthSession(BaseModel):
    userId: str
    name: str
    role: UserRole
    designation: str
    basin: str
    email: str
    canConfirmEscalate: bool
    canOverride: bool
    canManageDatasets: bool

class LoginResponse(BaseModel):
    session: AuthSession

# Incidents API Request / Response
class IngestIncidentRequest(BaseModel):
    site: str
    category: IncidentCategory
    reportedBy: str
    rawNarrative: str
    basin: Optional[str] = "Assam Operational Basin"

class ConfirmIncidentRequest(BaseModel):
    reviewedBy: str
    escalationNotes: Optional[str] = None
    role: Optional[UserRole] = None

class OverrideIncidentRequest(BaseModel):
    reviewedBy: str
    justification: str
    role: Optional[UserRole] = None

class GetIncidentsResponse(BaseModel):
    incidents: List[SafetyIncident]
    total: int
    page: int = 1
    pageSize: int = 50

# KPI / Analytics
class KPISummary(BaseModel):
    totalIngested: int
    flaggedSif: int
    pendingReview: int
    complianceRate: int

class RiskDistribution(BaseModel):
    level: RiskLevel
    count: int
    percentage: float

class AnalyticsResponse(BaseModel):
    kpi: KPISummary
    riskDistribution: List[RiskDistribution]
    lsrDistribution: List[Dict[str, Any]]
    siteDistribution: List[Dict[str, Any]]
    monthlyTrend: List[Dict[str, Any]]
