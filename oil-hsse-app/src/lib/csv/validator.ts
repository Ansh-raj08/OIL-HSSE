// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// CSV Ingestion Pipeline: Validator (Section 23 & 24)
// ============================================================

export interface ValidationIssue {
  rowNumber: number;
  field: string;
  type: 'ERROR' | 'WARNING';
  message: string;
}

export interface ValidationSummary {
  isValid: boolean;
  totalRows: number;
  validRowCount: number;
  invalidRowCount: number;
  warningRowCount: number;
  issues: ValidationIssue[];
  missingCrucialHeaders: string[];
}

/**
 * Common variations of narrative/description column names in E&P safety databases
 */
export const NARRATIVE_ALIASES = [
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
];

/**
 * Common variations of site/installation column names
 */
export const SITE_ALIASES = [
  'site',
  'location',
  'site_location',
  'installation',
  'facility',
  'asset',
  'rig',
  'station',
  'plant',
  'well',
];

/**
 * Flexibly checks if a header represents the incident narrative / observation description.
 */
export function isNarrativeHeader(header: string): boolean {
  const norm = header.toLowerCase().trim().replace(/[\s-_]+/g, '');
  if (!norm) return false;
  const isMatch = NARRATIVE_ALIASES.some((a) => {
    const aNorm = a.toLowerCase().trim().replace(/[\s-_]+/g, '');
    return norm === aNorm || norm.includes(aNorm) || (norm.length >= 5 && aNorm.includes(norm));
  });
  if (isMatch) return true;
  return norm.includes('narrative') || norm.includes('description') || norm.includes('observation');
}

/**
 * Validates parsed CSV headers and rows before cleaning and normalization.
 */
export function validateCsvData(
  headers: string[],
  rows: Record<string, string>[]
): ValidationSummary {
  const issues: ValidationIssue[] = [];

  // 1. Check for crucial narrative column
  const hasNarrativeHeader = headers.some((h) => isNarrativeHeader(h));

  const missingCrucialHeaders: string[] = [];
  if (!hasNarrativeHeader) {
    missingCrucialHeaders.push('Narrative/Description (Required for NLP & SIF Analysis)');
  }

  let validRowCount = 0;
  let invalidRowCount = 0;
  let warningRowCount = 0;

  // 2. Validate individual rows
  rows.forEach((row, index) => {
    const rowNum = index + 1;
    let rowHasError = false;
    let rowHasWarning = false;

    // Find narrative in this row
    const narrativeKey = Object.keys(row).find((k) => isNarrativeHeader(k));
    const narrativeValue = narrativeKey ? String(row[narrativeKey] || '').trim() : '';

    if (!narrativeValue) {
      issues.push({
        rowNumber: rowNum,
        field: narrativeKey || 'narrative',
        type: 'ERROR',
        message: 'Empty observation narrative: cannot perform SIF analysis.',
      });
      rowHasError = true;
    } else if (narrativeValue.length < 8) {
      issues.push({
        rowNumber: rowNum,
        field: narrativeKey || 'narrative',
        type: 'WARNING',
        message: 'Extremely brief narrative text: risk score confidence may be degraded.',
      });
      rowHasWarning = true;
    }

    // Check site
    const siteKey = Object.keys(row).find((k) => {
      const norm = k.toLowerCase().trim().replace(/[\s-_]+/g, '');
      return SITE_ALIASES.some((a) => {
        const aNorm = a.replace(/[\s-_]+/g, '');
        return norm === aNorm || norm.includes(aNorm) || aNorm.includes(norm);
      });
    });
    const siteValue = siteKey ? String(row[siteKey] || '').trim() : '';
    if (!siteValue) {
      issues.push({
        rowNumber: rowNum,
        field: siteKey || 'site',
        type: 'WARNING',
        message: 'Missing site location: will default to Brahmaputra Basin Installation.',
      });
      rowHasWarning = true;
    }

    if (rowHasError) {
      invalidRowCount++;
    } else {
      validRowCount++;
      if (rowHasWarning) {
        warningRowCount++;
      }
    }
  });

  const isValid = missingCrucialHeaders.length === 0 && validRowCount > 0;

  return {
    isValid,
    totalRows: rows.length,
    validRowCount,
    invalidRowCount,
    warningRowCount,
    issues,
    missingCrucialHeaders,
  };
}
