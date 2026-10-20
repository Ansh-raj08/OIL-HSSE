// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// CSV Ingestion Pipeline: Canonical Normalizer (Section 25 & 26)
// ============================================================

import { SafetyIncident, IncidentCategory } from '@/types/safety';
import { analyzeNarrative } from '@/lib/logic-engine/analyzer';

/**
 * Column matching rules for heterogeneous CSV files
 */
const COLUMN_MAPPINGS = {
  id: ['id', 'incident_id', 'report_no', 'log_id', 'record_id', 'reference_no', 'sl_no'],
  site: ['site', 'location', 'site_location', 'installation', 'facility', 'asset', 'rig', 'station', 'plant', 'well'],
  basin: ['basin', 'region', 'field', 'area', 'operational_basin'],
  category: ['category', 'incident_type', 'report_type', 'type', 'classification', 'event_type'],
  reportedBy: ['reported_by', 'reportedby', 'observer', 'officer', 'employee', 'reporter', 'supervisor', 'logged_by'],
  timestamp: ['timestamp', 'date', 'datetime', 'event_date', 'incident_date', 'time', 'occurred_at'],
  narrative: [
    'narrative',
    'raw_narrative',
    'description',
    'observation',
    'observation_narrative',
    'incident_narrative',
    'incident_description',
    'unsafe_act_description',
    'unsafe_condition_description',
    'event_narrative',
    'event_description',
    'details',
    'event_details',
    'hazard_details',
    'remarks',
    'findings',
  ],
};

function findMappedValue(row: Record<string, string>, candidates: string[]): string | undefined {
  const rowKeys = Object.keys(row);
  for (const candidate of candidates) {
    const cNorm = candidate.toLowerCase().trim().replace(/[\s-_]+/g, '');
    const matchedKey = rowKeys.find((k) => {
      const kNorm = k.toLowerCase().trim().replace(/[\s-_]+/g, '');
      return kNorm === cNorm || kNorm.includes(cNorm) || (kNorm.length >= 4 && cNorm.includes(kNorm));
    });
    if (matchedKey && row[matchedKey] !== undefined && String(row[matchedKey]).trim().length > 0) {
      return String(row[matchedKey]).trim();
    }
  }
  return undefined;
}

function parseCategory(rawCat: string | undefined): IncidentCategory {
  if (!rawCat) return 'UNSAFE_CONDITION';
  const lower = rawCat.toLowerCase();
  if (lower.includes('act') || lower.includes('behavior') || lower.includes('unsafe_act')) {
    return 'UNSAFE_ACT';
  }
  if (lower.includes('near') || lower.includes('miss') || lower.includes('near_miss')) {
    return 'NEAR_MISS';
  }
  return 'UNSAFE_CONDITION';
}

/**
 * Normalizes cleaned CSV records into canonical SafetyIncident entities,
 * executing the NLP/XAI logic engine on each narrative to generate risk scores,
 * Life-Saving Rules mappings, and Hierarchy of Controls.
 */
export function normalizeCsvRows(
  cleanedRows: Record<string, string>[],
  options?: { startIdIndex?: number; defaultBasin?: string; defaultSite?: string; datasetId?: string }
): SafetyIncident[] {
  const startIndex = options?.startIdIndex ?? 2001;
  const defaultBasin = options?.defaultBasin || 'Assam Operational Basin';
  const defaultSite = options?.defaultSite || 'Brahmaputra Basin Asset';
  const datasetId = options?.datasetId;

  return cleanedRows.map((row, idx) => {
    const rawNarrative =
      findMappedValue(row, COLUMN_MAPPINGS.narrative) ||
      'Routine observation recorded during tour shift.';

    const site = findMappedValue(row, COLUMN_MAPPINGS.site) || defaultSite;
    const basin = findMappedValue(row, COLUMN_MAPPINGS.basin) || defaultBasin;
    const reportedBy =
      findMappedValue(row, COLUMN_MAPPINGS.reportedBy) || 'Field HSSE Observer';
    const category = parseCategory(findMappedValue(row, COLUMN_MAPPINGS.category));
    const timestamp =
      findMappedValue(row, COLUMN_MAPPINGS.timestamp) ||
      new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
      }) + ' IST';

    const id =
      findMappedValue(row, COLUMN_MAPPINGS.id) ||
      `OIL-2026-${startIndex + idx}`;

    // Execute the unified NLP & SIF logic engine
    const analysis = analyzeNarrative(rawNarrative, site);

    // Truncate narrative for compact triage stream display
    const truncatedNarrative =
      rawNarrative.length > 120 ? rawNarrative.substring(0, 117) + '...' : rawNarrative;

    return {
      id,
      timestamp,
      site,
      basin,
      reportedBy,
      category,
      rawNarrative,
      truncatedNarrative,
      riskScore: analysis.risk.score,
      riskLevel: analysis.risk.level,
      isSifPrecursor: analysis.isSifPrecursor,
      lsrCategory: analysis.lsr.code,
      lsrTitle: analysis.lsr.title,
      lsrViolations: analysis.lsrViolations,
      xaiTriggers: analysis.xaiTriggers,
      hierarchyActions: analysis.hierarchyActions,
      validationStatus: 'PENDING',
      escalationLikelihood: analysis.escalationLikelihood,
      datasetId,
    };
  });
}
