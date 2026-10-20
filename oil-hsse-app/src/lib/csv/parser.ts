// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// CSV Ingestion Pipeline: Parser (Section 21 & 22)
// ============================================================

import Papa from 'papaparse';

export interface ParseResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  delimiter: string;
  errors: string[];
}

/**
 * Parses raw CSV content (string or File) into typed rows and headers.
 * Uses PapaParse with header autodetection and dynamic typing.
 */
export async function parseCsvContent(
  input: string | File,
  options?: { maxRows?: number }
): Promise<ParseResult> {
  const csvString = typeof input === 'string' ? input : await input.text();

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(csvString, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => (typeof value === 'string' ? value.trim() : value),
      preview: options?.maxRows || 0,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = (results.data || []).filter((row) => {
          return Object.values(row).some((val) => val && String(val).trim().length > 0);
        });

        const errors = results.errors.map(
          (err) => `Row ${err.row ?? 'Unknown'}: ${err.message}`
        );

        resolve({
          headers,
          rows,
          totalRows: rows.length,
          delimiter: results.meta.delimiter || ',',
          errors,
        });
      },
      error: (error: Error) => {
        reject(new Error(`CSV Parsing Failed: ${error.message}`));
      },
    });
  });
}
