// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Logic Engine: LSR (Life-Saving Rule) Mapper
// ============================================================
//
// Maps safety narratives to IOGP Life-Saving Rules using
// domain-specific keyword matching. Deterministic and explainable.
//
// NOTE: This is prototype/demo classification, NOT ML-based.
// The architecture allows this module to be replaced by a real
// NLP classifier without changing the rest of the pipeline.
// ============================================================

import type { LSRCode } from '@/types/safety';

export interface LSRClassification {
  /** The matched LSR code, e.g. "LSR-03" */
  code: LSRCode;
  /** Human-readable title, e.g. "LSR-03: Working at Height" */
  title: string;
  /** Confidence indicator for prototype: 'RULE_MATCHED' or 'DEFAULT' */
  matchType: 'RULE_MATCHED' | 'DEFAULT';
  /** The keyword category that triggered the match */
  matchedCategory: string;
  /** Secondary matched LSRs for multi-hazard explainability */
  secondaryMatches?: { code: LSRCode; title: string; category: string }[];
}

/**
 * Keyword groups mapped to the 9 IOGP Life-Saving Rules (IOGP Report 459).
 *
 * Each group contains regex patterns representative of upstream E&P safety narratives.
 * Groups are ordered by hazard energy & specificity:
 * 1. Toxic Gas (LSR-07) - immediate life threat
 * 2. Energy Isolation (LSR-01) - high-pressure release
 * 3. Confined Space (LSR-02) - asphyxiation / entrapment
 * 4. Hot Work (LSR-04) - hydrocarbon explosion / fire
 * 5. Working at Height (LSR-03) - gravity / fall from elevation
 * 6. Line of Fire (LSR-06) - dynamic impact, dropped objects, whip line, pinch points
 * 7. Mechanical Lifting (LSR-09) - crane, suspended loads, rigging
 * 8. Driving & Vehicle Safety (LSR-05) - road transport, tankers, bowsers
 * 9. Bypassing Safety Controls (LSR-08) - interlock overrides, SCE tampering
 */
export const LSR_KEYWORD_GROUPS: {
  code: LSRCode;
  title: string;
  category: string;
  patterns: RegExp;
  /** Base risk score contribution when this LSR is matched */
  baseScore: number;
}[] = [
  {
    code: 'LSR-07',
    title: 'LSR-07: H₂S / Toxic Gas Exposure',
    category: 'toxic_gas',
    patterns:
      /h2s|hydrogen\s+sulphide|toxic\s+gas|ppm\s+(h2s|gas)|gas\s+monitor|eeba|scba|breathing\s+apparatus|respirator|sour\s+(gas|crude)|mercaptan|sulfur\s+dioxide|so2|lethal\s+concentration|gas\s+leak|gas\s+alarm|gas\s+cloud/i,
    baseScore: 40,
  },
  {
    code: 'LSR-08',
    title: 'LSR-08: Bypassing Safety Controls',
    category: 'safety_controls',
    patterns:
      /bypass(ed|ing)?|safety\s+interlock|inhibit|overrid(e|den)|tamper|disabled|safety\s+control|safety\s+critical\s+element|\bsce\b|alarm\s+shelved|defeat(ed|ing)?\s+interlock|relief\s+valve\s+isolated|\bpsv\b\s+gagged/i,
    baseScore: 36,
  },
  {
    code: 'LSR-02',
    title: 'LSR-02: Confined Space Entry',
    category: 'confined_space',
    patterns:
      /confined\s+space|manway|vessel\s+entry|tank\s+(entry|cleaning|inspection)|separator\s+(entry|vessel)|sump(\s+pit)?|mud\s+pit|frac\s+tank|column\s+entry|below\s+grade|enclosed\s+(space|area)|oxygen\s+(deficien\w*|enrich\w*)|atmospheric\s+test(ing)?|hole\s+watch|standby\s+(person|attendant)|trench\s+entry|excavation\s+entry|slug\s+catcher\s+entry/i,
    baseScore: 37,
  },
  {
    code: 'LSR-06',
    title: 'LSR-06: Line of Fire & Dropped Objects',
    category: 'line_of_fire',
    patterns:
      /line\s+of\s+fire|drop\s+zone|exclusion\s+zone|struck\s+by|falling\s+object|dropped\s+object|rotary\s+table|tongs?(\s+swing|\s+line)?|cathead|winch\s+line|snubbing|whipping\s+hose|whip\s*check|pressurized\s+hose|stored\s+energy|pinch\s+point|crush(ed|ing)?\s+hazard|moving\s+machinery|rebound\s+zone|pressure\s+recoil/i,
    baseScore: 35,
  },
  {
    code: 'LSR-01',
    title: 'LSR-01: Energy Isolation / LOTO',
    category: 'energy_isolation',
    patterns:
      /loto|lockout|tagout|lock.out|tag.out|isolat(ed|ion)|manifold\s+isolation|depressuri[sz]|esd\s+valve|bleed\s+down|blind(ing)?|spade|double\s+block|dbb|hazardous\s+energy|live\s+circuit|electrical\s+isolation|zero\s+energy|de-energiz|trapped\s+pressure|unrelieved\s+pressure|residual\s+pressure/i,
    baseScore: 38,
  },
  {
    code: 'LSR-04',
    title: 'LSR-04: Hot Work',
    category: 'hot_work',
    patterns:
      /hot\s+work|grinding|welding|weld(er|ing)?|open\s+flame|explosive\s+atmospher|lel|spark|ignition|combustible|cutting\s+torch|brazing|gas\s+free|hydrocarbon\s+vapou?r|flammable\s+gas|fire\s+watch/i,
    baseScore: 36,
  },
  {
    code: 'LSR-03',
    title: 'LSR-03: Working at Height',
    category: 'working_at_height',
    patterns:
      /height|meter(s)?\s+height|monkey\s+board|scaffold(ing)?|ladder|fall\s+(arrest|protection|hazard)|lanyard|harness|tie.off|derrick|mast|elevated\s+platform|work\s+basket|man\s+basket|floor\s+opening|open\s+hatch|handrail\s+missing|edge\s+protection/i,
    baseScore: 35,
  },
  {
    code: 'LSR-09',
    title: 'LSR-09: Mechanical Lifting Operations',
    category: 'lifting',
    patterns:
      /crane|suspended\s+load|rigging|sling(s)?|hoist(ing)?|bop\s+(handling|lift)|tubular\s+lift|lifting\s+(gear|ops|operation)|spreader\s+bar|tag\s+line|shackle|load\s+line|banksman|rigger|crane\s+hook|winch\s+drum/i,
    baseScore: 34,
  },
  {
    code: 'LSR-05',
    title: 'LSR-05: Driving & Vehicle Safety',
    category: 'driving',
    patterns:
      /driv(ing|er)|vehicle|seatbelt|speed(ing)?|escort|transport|trailer|km\/h|road|tanker|bowser|journey\s+management|rollover|forklift|heavy\s+truck/i,
    baseScore: 30,
  },
];

/**
 * Classifies a safety narrative against IOGP Life-Saving Rules.
 * Supports primary classification and identifies any secondary matched rules.
 *
 * @param narrative - The raw incident narrative text.
 * @returns The best-matching LSR classification with any secondary matches.
 */
export function classifyLSR(narrative: string): LSRClassification {
  const allMatches: { code: LSRCode; title: string; category: string }[] = [];

  for (const group of LSR_KEYWORD_GROUPS) {
    if (group.patterns.test(narrative)) {
      allMatches.push({
        code: group.code,
        title: group.title,
        category: group.category,
      });
    }
  }

  if (allMatches.length > 0) {
    const primary = allMatches[0];
    const secondary = allMatches.slice(1);
    return {
      code: primary.code,
      title: primary.title,
      matchType: 'RULE_MATCHED',
      matchedCategory: primary.category,
      secondaryMatches: secondary.length > 0 ? secondary : undefined,
    };
  }

  // Default fallback — when no specific LSR pattern matched
  return {
    code: 'LSR-08',
    title: 'LSR-08: Bypassing Safety Controls',
    matchType: 'DEFAULT',
    matchedCategory: 'general',
  };
}

/**
 * Returns the base risk score contribution for a matched LSR code.
 * Used by the risk scorer to add domain-specific weight.
 */
export function getLSRBaseScore(narrative: string): number {
  for (const group of LSR_KEYWORD_GROUPS) {
    if (group.patterns.test(narrative)) {
      return group.baseScore;
    }
  }
  return 15; // minimal baseline for unmatched narratives
}
