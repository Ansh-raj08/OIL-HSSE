// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Logic Engine: Negation-Aware Safety Phrase Detector
// ============================================================
//
// IMPORTANT: Safety narratives are semantically sensitive.
// "not depressurized" must NEVER accidentally become "depressurized".
// This module detects absence/violation phrases — do NOT alter
// the original narrative text.
// ============================================================

export interface NegationMatch {
  /** The full matched phrase, e.g. "without secondary lanyard" */
  phrase: string;
  /** The negation keyword that triggered the match */
  negationKeyword: string;
  /** Character index where the match starts in the original text */
  startIndex: number;
}

/**
 * Canonical negation patterns used in upstream oil & gas safety narratives.
 *
 * Each pattern captures a negation keyword followed by a descriptive phrase.
 * The patterns are designed to match common safety-language constructions
 * such as "without safety harness", "not depressurized", "no isolation certificate",
 * "bypassed lockout/tagout", "failed to maintain", etc.
 */
const NEGATION_PATTERNS: { keyword: string; regex: RegExp }[] = [
  { keyword: 'without',         regex: /without\s+([a-z0-9\s/\-]{3,35})/gi },
  { keyword: 'not',             regex: /\bnot\s+([a-z0-9\s/\-]{3,30})/gi },
  { keyword: 'no',              regex: /\bno\s+([a-z0-9\s/\-]{3,30})/gi },
  { keyword: 'never',           regex: /\bnever\s+([a-z0-9\s/\-]{3,30})/gi },
  { keyword: 'bypassed',        regex: /bypassed\s+([a-z0-9\s/\-]{3,35})/gi },
  { keyword: 'unhooked',        regex: /unhooked\s+([a-z0-9\s/\-]{3,30})/gi },
  { keyword: 'failed to',       regex: /failed\s+to\s+([a-z0-9\s/\-]{3,35})/gi },
  { keyword: 'did not',         regex: /did\s+not\s+([a-z0-9\s/\-]{3,35})/gi },
  { keyword: 'zero',            regex: /\bzero\s+([a-z0-9\s/\-]{3,30})/gi },
  { keyword: 'missing',         regex: /\bmissing\s+([a-z0-9\s/\-]{3,35})/gi },
  { keyword: 'lacked',          regex: /\black(ed|ing)\s+([a-z0-9\s/\-]{3,35})/gi },
  { keyword: 'omitted',         regex: /\bomitted\s+([a-z0-9\s/\-]{3,35})/gi },
  { keyword: 'in violation of', regex: /in\s+violation\s+of\s+([a-z0-9\s/\-]{3,35})/gi },
  { keyword: 'unauthorized',    regex: /\bunauthorized\s+([a-z0-9\s/\-]{3,35})/gi },
  { keyword: 'unattended',      regex: /\bunattended\s+([a-z0-9\s/\-]{3,35})/gi },
  { keyword: 'unsecured',       regex: /\bunsecured\s+([a-z0-9\s/\-]{3,35})/gi },
  { keyword: 'refused to',      regex: /refused\s+to\s+([a-z0-9\s/\-]{3,35})/gi },
];

/**
 * Detects negation phrases in a safety narrative.
 *
 * @param narrative - The raw incident narrative text.
 * @returns Array of detected negation matches with phrase, keyword, and position.
 *
 * @example
 * ```ts
 * const matches = detectNegations(
 *   "Roustabout working without safety harness. Tie-off was not maintained."
 * );
 * // [
 * //   { phrase: "without safety harness", negationKeyword: "without", startIndex: 21 },
 * //   { phrase: "not maintained", negationKeyword: "not", startIndex: 56 },
 * // ]
 * ```
 */
/**
 * Phrases that indicate positive absence-of-harm rather than a violated safety barrier.
 * e.g., "no injury", "no damage", "no active pressure release", "no gas leak".
 */
const BENIGN_ABSENCE_PATTERN =
  /\b(injury|injuries|damage|release|leak|spill|harm|fire|incident|loss|impact|active\s+leak|active\s+release|active\s+fire|hazard\s+found)\b/i;

/**
 * Detects negation phrases in a safety narrative.
 *
 * @param narrative - The raw incident narrative text.
 * @returns Array of detected negation matches with phrase, keyword, and position.
 */
export function detectNegations(narrative: string): NegationMatch[] {
  const matches: NegationMatch[] = [];

  for (const { keyword, regex } of NEGATION_PATTERNS) {
    // Reset lastIndex — RegExp with /g flag is stateful
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(narrative)) !== null) {
      const capturedPhrase = match[0].trim();
      const afterKeyword = match[1] || '';

      // Skip benign absence-of-consequence statements
      if (BENIGN_ABSENCE_PATTERN.test(afterKeyword)) {
        continue;
      }

      matches.push({
        phrase: capturedPhrase,
        negationKeyword: keyword,
        startIndex: match.index,
      });
    }
  }

  // Sort by position in narrative for stable, deterministic output
  matches.sort((a, b) => a.startIndex - b.startIndex);

  return matches;
}

/**
 * Returns just the phrase strings for backward compatibility.
 */
export function detectNegationPhrases(narrative: string): string[] {
  return detectNegations(narrative).map((m) => m.phrase);
}
