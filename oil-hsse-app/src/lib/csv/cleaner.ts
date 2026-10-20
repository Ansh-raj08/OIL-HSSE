// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// CSV Ingestion Pipeline: Cleaner (Section 23 & 24)
// ============================================================

export interface CleanedRow {
  data: Record<string, string>;
  isDuplicate: boolean;
  warnings: string[];
}

export interface CleaningReport {
  totalCleaned: number;
  duplicateCount: number;
  controlCharactersStripped: number;
  whitespaceFixed: number;
  datesStandardized: number;
}

/**
 * Standardizes common date/time formats encountered in oilfield logs
 * into a clean, human-readable IST / ISO representation.
 */
function cleanDate(val: string): string {
  if (!val || val.trim().length === 0) {
    return new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
    }) + ' IST';
  }

  const trimmed = val.trim();
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return (
      d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) +
      ', ' +
      d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) +
      ' IST'
    );
  }

  return trimmed;
}

/**
 * Cleans textual content by stripping control characters and normalizing whitespace
 * without modifying domain vocabulary or safety negations.
 */
function cleanText(text: string): { cleaned: string; hadControlChars: boolean; hadWhitespaceIssues: boolean } {
  if (!text) return { cleaned: '', hadControlChars: false, hadWhitespaceIssues: false };

  // Check for non-printable control characters (excluding newline and tab)
  const hadControlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(text);
  const stripped = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Normalize Unicode quotes and dashes
  const normalizedQuotes = stripped
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-');

  // Collapse excess whitespace while preserving word boundary
  const hadWhitespaceIssues = /\s{2,}/.test(normalizedQuotes) || /^\s|\s$/.test(normalizedQuotes);
  const cleaned = normalizedQuotes.replace(/[ \t]+/g, ' ').trim();

  return { cleaned, hadControlChars, hadWhitespaceIssues };
}

/**
 * Executes syntactic cleaning across all raw CSV rows.
 * Explicitly protects safety negations from deletion.
 */
export function cleanCsvData(
  rows: Record<string, string>[]
): { cleanedRows: CleanedRow[]; report: CleaningReport } {
  let controlCharactersStripped = 0;
  let whitespaceFixed = 0;
  let duplicateCount = 0;
  let datesStandardized = 0;

  const seenNarratives = new Set<string>();
  const cleanedRows: CleanedRow[] = [];

  rows.forEach((row) => {
    const cleanedData: Record<string, string> = {};
    const warnings: string[] = [];

    let rowHadControl = false;
    let rowHadWhitespace = false;

    // Clean each column
    for (const [key, value] of Object.entries(row)) {
      const { cleaned, hadControlChars, hadWhitespaceIssues } = cleanText(String(value || ''));
      if (hadControlChars) rowHadControl = true;
      if (hadWhitespaceIssues) rowHadWhitespace = true;

      // Special handling for date columns
      if (/date|time|timestamp/i.test(key)) {
        const dateCleaned = cleanDate(cleaned);
        if (dateCleaned !== cleaned) datesStandardized++;
        cleanedData[key] = dateCleaned;
      } else {
        cleanedData[key] = cleaned;
      }
    }

    if (rowHadControl) controlCharactersStripped++;
    if (rowHadWhitespace) whitespaceFixed++;

    // Deduplication check based on narrative similarity
    const narrativeVal = Object.entries(cleanedData).find(([k]) =>
      /narrative|description|observation/i.test(k)
    )?.[1];

    let isDuplicate = false;
    if (narrativeVal && narrativeVal.length > 10) {
      const normalizedKey = narrativeVal.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seenNarratives.has(normalizedKey)) {
        isDuplicate = true;
        duplicateCount++;
        warnings.push('Duplicate observation narrative detected in this dataset.');
      } else {
        seenNarratives.add(normalizedKey);
      }
    }

    cleanedRows.push({
      data: cleanedData,
      isDuplicate,
      warnings,
    });
  });

  return {
    cleanedRows,
    report: {
      totalCleaned: cleanedRows.length,
      duplicateCount,
      controlCharactersStripped,
      whitespaceFixed,
      datesStandardized,
    },
  };
}
