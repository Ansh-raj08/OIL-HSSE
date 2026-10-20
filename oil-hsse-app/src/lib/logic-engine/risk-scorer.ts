// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Logic Engine: Deterministic Risk Scorer
// ============================================================
//
// Computes a 0-100 risk priority score from safety narrative text.
//
// Scoring is DETERMINISTIC and RULE-BASED (not ML).
// Score = baseline + hazard_keyword_weight + negation_multiplier
//
// IMPORTANT: Do NOT present these scores as statistical probabilities.
// A score of 94 means "94 on our deterministic scale", NOT "94% probability
// of injury". This distinction matters for SIH judging and safety credibility.
// ============================================================

import type { RiskLevel } from '@/types/safety';
import { detectNegations, type NegationMatch } from './negation-detector';
import { getLSRBaseScore } from './lsr-mapper';

export interface RiskAssessment {
  /** Deterministic risk score: 0-100 */
  score: number;
  /** Risk level derived from score */
  level: RiskLevel;
  /** Whether this qualifies as a SIF precursor (score >= 65) */
  isSifPrecursor: boolean;
  /** Negation matches that contributed to elevated risk */
  negationMatches: NegationMatch[];
  /** High-energy precursor modifiers detected */
  highEnergyModifiers: string[];
  /** The LSR-based hazard score component */
  hazardScore: number;
  /** The negation-based score component */
  negationScore: number;
  /** High-energy modifier score component */
  highEnergyScore: number;
}

/** Per-negation weight added to the risk score */
const NEGATION_WEIGHT = 16;

/** Minimum possible risk score */
const SCORE_FLOOR = 8;

/** Maximum possible risk score */
const SCORE_CEILING = 98;

/** Baseline risk score for generic logs */
const BASELINE_SCORE = 15;

/** SIF precursor threshold */
export const SIF_THRESHOLD = 65;

/**
 * High-Energy Hazard Multipliers typical of Serious Injury & Fatality precursors in E&P.
 * Grounded in the Campbell Institute / Energy Wheel SIF Framework.
 */
const HIGH_ENERGY_PATTERNS: { name: string; regex: RegExp; weight: number }[] = [
  {
    name: 'High Pressure Energy (>500 psi / Kick / Blowout / Uncontrolled Release)',
    regex: /(high\s+pressure|\b([5-9]\d{2}|\d{4,})\s*psi\b|well\s+kick|blowout|uncontrolled\s+(flow|release|leak)|pressure\s+surge)/i,
    weight: 14,
  },
  {
    name: 'Elevation Fall Potential (>4m / Monkey Board / Derrick / Mast)',
    regex: /(\b([4-9]|\d{2,})\s*meter(s)?\b|monkey\s+board|derrick|mast\s+top|crown\s+block|offshore\s+rig\s+edge)/i,
    weight: 12,
  },
  {
    name: 'Lethal Toxic Gas Energy (H2S >10 ppm / Release in Breathing Zone)',
    regex: /(h2s\s+(release|leak|alarm|cloud)|\b(1[0-9]|[2-9]\d|\d{3,})\s*ppm\s+h2s|sour\s+gas\s+leak|lethal\s+toxic)/i,
    weight: 15,
  },
  {
    name: 'Heavy Suspended Mass / Drop Zone Vector (BOP / Tubulars / Crane Over Personnel)',
    regex: /(suspended\s+(load|pipe|casing|bop|tubular|drill\s+string)\s+(over|above)|under\s+suspended|drop\s+zone\s+breach)/i,
    weight: 12,
  },
  {
    name: 'Explosive Atmosphere / Ignition Energy in Hydrocarbon Hazard Zone',
    regex: /(explosive\s+atmospher|\b([1-9]\d|\d{3,})%\s*lel|spark\s+near\s+(tank|wellhead|manifold|separator)|gas\s+leak\s+igni)/i,
    weight: 14,
  },
  {
    name: 'Confined Space Oxygen Deficiency / Entrapment Vector',
    regex: /(oxygen\s+deficien|unventilated|o2\s+<\s*19|below\s+19\.5%|toxic\s+atmosphere\s+in\s+(vessel|tank|sump))/i,
    weight: 14,
  },
  {
    name: 'Dynamic Kinetic Vector / High Tension Whipping Hazard',
    regex: /(whipping\s+hose|parted\s+wireline|snubbing\s+force|cathead\s+entangle|tongs\s+swing|drill\s+string\s+spin)/i,
    weight: 12,
  },
];

/**
 * Derives RiskLevel from a numeric score.
 *
 * | Score | Level |
 * |-------|-------|
 * | >= 80 | CRITICAL |
 * | >= 60 | HIGH |
 * | >= 30 | MEDIUM |
 * | < 30  | LOW |
 */
export function deriveRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

/**
 * Detects high-energy precursor conditions from the narrative.
 */
export function detectHighEnergyModifiers(narrative: string): { names: string[]; score: number } {
  const names: string[] = [];
  let score = 0;

  for (const item of HIGH_ENERGY_PATTERNS) {
    if (item.regex.test(narrative)) {
      names.push(item.name);
      score += item.weight;
    }
  }

  // Cap high energy bonus to prevent score inflation beyond ceiling
  return { names, score: Math.min(score, 24) };
}

/**
 * Computes a deterministic risk assessment for a safety narrative.
 *
 * The scoring model:
 * 1. Start with a baseline score (15)
 * 2. Add hazard keyword contribution via LSR mapper (30-40 points)
 * 3. Add per-negation contribution (16 points each)
 * 4. Add high-energy precursor bonus (up to 24 points)
 * 5. Clamp to [8, 98]
 *
 * @param narrative - The raw incident narrative text.
 * @returns Full risk assessment with score breakdown.
 */
export function assessRisk(narrative: string): RiskAssessment {
  // 1. Detect negation phrases
  const negationMatches = detectNegations(narrative);

  // 2. Get hazard score from LSR keyword matching
  const hazardScore = getLSRBaseScore(narrative);

  // 3. Detect high-energy energy vectors
  const highEnergy = detectHighEnergyModifiers(narrative);

  // 4. Calculate negation contribution
  const negationScore = negationMatches.length * NEGATION_WEIGHT;

  // 5. Routine observation check (positive compliance with no negation or high energy)
  const isRoutineCompliant =
    negationMatches.length === 0 &&
    highEnergy.score === 0 &&
    /routine|housekeeping|toolbox\s+talk|shift\s+handover|ppe\s+worn|normal\s+ops|satisfactory/i.test(narrative);

  // 6. Sum and clamp
  const rawScore = isRoutineCompliant
    ? Math.min(hazardScore, 22)
    : BASELINE_SCORE + hazardScore + negationScore + highEnergy.score;

  const score = Math.min(Math.max(rawScore, SCORE_FLOOR), SCORE_CEILING);

  // 7. Derive level and SIF status
  const level = deriveRiskLevel(score);
  const isSifPrecursor = score >= SIF_THRESHOLD;

  return {
    score,
    level,
    isSifPrecursor,
    negationMatches,
    highEnergyModifiers: highEnergy.names,
    hazardScore,
    negationScore,
    highEnergyScore: highEnergy.score,
  };
}
