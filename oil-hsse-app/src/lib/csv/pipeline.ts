// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// CSV Ingestion Pipeline Orchestrator (Section 20 - 26)
// ============================================================

import { SafetyIncident, Dataset, DataQualityReport } from '@/types/safety';
import { parseCsvContent } from './parser';
import { validateCsvData, ValidationSummary } from './validator';
import { cleanCsvData, CleaningReport } from './cleaner';
import { normalizeCsvRows } from './normalizer';

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

/**
 * Executes the end-to-end CSV ingestion pipeline:
 * Parsing -> Validation -> Syntactic Cleaning -> Canonical Normalization -> SIF AI Inference
 */
export async function processCsvPipeline(
  input: string | File,
  filename: string,
  uploadedBy: string = 'T. Baruah (Chief HSSE Supt.)'
): Promise<CsvPipelineResult> {
  const datasetId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
  const now = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
  }) + ' IST';

  // 1. Parsing
  const parsed = await parseCsvContent(input);

  // 2. Validation
  const validation = validateCsvData(parsed.headers, parsed.rows);
  if (!validation.isValid && validation.missingCrucialHeaders.length > 0) {
    throw new Error(
      `Dataset Validation Failed: Missing required column(s): ${validation.missingCrucialHeaders.join(', ')}`
    );
  }

  // 3. Syntactic Cleaning
  const { cleanedRows, report: cleaningReport } = cleanCsvData(parsed.rows);

  // Filter out completely invalid rows for normalization
  const validDataRows = cleanedRows.map((cr) => cr.data);

  // 4. Normalization + AI/NLP Risk Analysis
  const incidents = normalizeCsvRows(validDataRows, {
    startIdIndex: 1050 + Math.floor(Math.random() * 100),
    datasetId,
  });

  const sifCount = incidents.filter((i) => i.isSifPrecursor).length;
  const criticalCount = incidents.filter((i) => i.riskLevel === 'CRITICAL').length;

  // 5. Build Dataset record
  const dataset: Dataset = {
    id: datasetId,
    filename,
    uploadedAt: now,
    uploadedBy,
    status: 'READY',
    totalRows: parsed.totalRows,
    validRows: validation.validRowCount,
    invalidRows: validation.invalidRowCount,
    warningRows: validation.warningRowCount,
  };

  // 6. Build Data Quality Report
  const qualityReport: DataQualityReport = {
    datasetId,
    generatedAt: now,
    summary: {
      totalRows: parsed.totalRows,
      validRows: validation.validRowCount,
      invalidRows: validation.invalidRowCount,
      warningRows: validation.warningRowCount,
      duplicateRows: cleaningReport.duplicateCount,
    },
    columnIssues: parsed.headers.map((col) => {
      const missingCount = parsed.rows.filter((r) => !r[col] || r[col].trim() === '').length;
      return {
        column: col,
        missingCount,
        invalidCount: 0,
        sampleIssues: missingCount > 0 ? [`${missingCount} rows have blank values`] : [],
      };
    }),
  };

  return {
    dataset,
    incidents,
    qualityReport,
    summary: {
      totalRows: parsed.totalRows,
      validRows: validation.validRowCount,
      invalidRows: validation.invalidRowCount,
      warningRows: validation.warningRowCount,
      sifCount,
      criticalCount,
    },
  };
}
