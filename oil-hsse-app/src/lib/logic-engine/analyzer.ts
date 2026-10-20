// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Logic Engine: Unified Analysis Pipeline
// ============================================================
//
// This is the main entry point for analyzing a safety narrative.
// It orchestrates:
//   1. Negation detection
//   2. Risk scoring
//   3. LSR classification
//   4. XAI trigger generation
//   5. Hierarchy-of-Controls recommendations
//
// All results are returned as a single AnalysisResult suitable
// for both real-time UI preview and batch CSV processing.
//
// ARCHITECTURE NOTE: This module is a pure function pipeline.
// It does NOT depend on React, DOM, or any UI framework.
// It can be called from:
//   - IngestionModal (real-time preview)
//   - CSV batch processor
//   - Future Python backend (via API)
//   - Unit tests
// ============================================================

import type { XAITrigger, HierarchyAction, LSRCode, RiskLevel, LSRViolation, EscalationLikelihood } from '@/types/safety';
import { detectNegations, type NegationMatch } from './negation-detector';
import { assessRisk, type RiskAssessment } from './risk-scorer';
import { classifyLSR, type LSRClassification } from './lsr-mapper';
import { generateRecommendations } from './recommendation-generator';
import { evaluateEscalationLikelihood } from './escalation-evaluator';

/**
 * Complete analysis result for a single safety narrative.
 * Contains all information needed to populate the SafetyIncident model.
 */
export interface AnalysisResult {
  /** Deterministic risk assessment */
  risk: RiskAssessment;
  /** Life-Saving Rule classification */
  lsr: LSRClassification;
  /** Explainability triggers for the XAI console */
  xaiTriggers: XAITrigger[];
  /** Recommended hierarchy-of-controls actions */
  hierarchyActions: HierarchyAction[];
  /** LSR violations for the incident record */
  lsrViolations: LSRViolation[];
  /** Whether the narrative triggered a SIF precursor flag */
  isSifPrecursor: boolean;
  /** Raw negation matches for debugging/audit */
  negationMatches: NegationMatch[];
  /** Rule-based Escalation Likelihood indicator */
  escalationLikelihood: EscalationLikelihood;
}

/**
 * Analyzes a safety narrative through the complete logic engine pipeline.
 *
 * This is the primary function consumers should call. It runs the full
 * analysis and returns all results needed to create a SafetyIncident.
 *
 * @param narrative - The raw incident narrative text.
 * @param site - The site name (used for recommendation context).
 * @returns Complete analysis result.
 *
 * @example
 * ```ts
 * const result = analyzeNarrative(
 *   "Roustabout working at 8m on monkey board without secondary lanyard. Tie-off not maintained.",
 *   "Duliajan Rig #7"
 * );
 * console.log(result.risk.score);        // 87
 * console.log(result.risk.level);         // "CRITICAL"
 * console.log(result.lsr.code);           // "LSR-03"
 * console.log(result.isSifPrecursor);     // true
 * console.log(result.xaiTriggers.length); // 2 (negation-based triggers)
 * ```
 */
export function analyzeNarrative(narrative: string, site: string = 'Unknown Site'): AnalysisResult {
  // Step 1: Risk assessment (includes negation detection internally)
  const risk = assessRisk(narrative);

  // Step 2: LSR classification
  const lsr = classifyLSR(narrative);

  // Step 3: Generate XAI triggers from both high-energy vectors and negation matches
  const xaiTriggers = buildXAITriggers(risk.negationMatches, risk.highEnergyModifiers, narrative);

  // Step 4: Build LSR violations (primary and secondary)
  const lsrViolations = buildLSRViolations(lsr);

  // Step 5: Generate recommendations
  const hierarchyActions = generateRecommendations(
    lsr.code,
    lsr.title,
    risk.isSifPrecursor,
    site
  );

  // Step 6: Evaluate Escalation Likelihood
  const escalationLikelihood = evaluateEscalationLikelihood({
    riskScore: risk.score,
    riskLevel: risk.level,
    highEnergyModifiers: risk.highEnergyModifiers,
    negationMatches: risk.negationMatches,
    validationStatus: 'PENDING',
    site,
    lsrCode: lsr.code,
  });

  return {
    risk,
    lsr,
    xaiTriggers,
    hierarchyActions,
    lsrViolations,
    isSifPrecursor: risk.isSifPrecursor,
    negationMatches: risk.negationMatches,
    escalationLikelihood,
  };
}

/**
 * Builds XAI triggers from detected high-energy vectors and negation matches.
 * SIF Precursor = High-Energy Hazard + Failed/Compromised Barrier.
 */
function buildXAITriggers(
  negationMatches: NegationMatch[],
  highEnergyModifiers: string[],
  narrative: string
): XAITrigger[] {
  const triggers: XAITrigger[] = [];

  // High-Energy Hazard Indicators
  if (highEnergyModifiers && highEnergyModifiers.length > 0) {
    for (const mod of highEnergyModifiers) {
      const shortToken = mod.split('(')[0].trim();
      triggers.push({
        token: shortToken,
        weight: 0.88,
        context: `High-energy precursor vector identified: ${mod}`,
        isNegation: false,
      });
    }
  }

  // Compromised / Missing Safety Barriers
  if (negationMatches.length > 0) {
    for (const neg of negationMatches) {
      triggers.push({
        token: neg.phrase,
        weight: 0.94,
        context: `Compromised barrier / negation clause: "${neg.phrase}" in narrative`,
        isNegation: true,
      });
    }
  }

  if (triggers.length > 0) {
    return triggers;
  }

  // Fallback for compliant/routine observations
  return [
    {
      token: 'routine observation',
      weight: 0.15,
      context: 'Standard field activity logged without high-energy escalation markers',
      isNegation: false,
    },
  ];
}

/**
 * Builds LSR violation records from the classification result.
 */
function buildLSRViolations(lsr: LSRClassification): LSRViolation[] {
  if (lsr.matchType === 'DEFAULT') {
    return [];
  }

  const violations: LSRViolation[] = [
    {
      code: lsr.code,
      label: lsr.title,
      description: `Primary potential violation under ${lsr.title}.`,
    },
  ];

  if (lsr.secondaryMatches && lsr.secondaryMatches.length > 0) {
    for (const sec of lsr.secondaryMatches) {
      violations.push({
        code: sec.code,
        label: sec.title,
        description: `Associated secondary rule: ${sec.title}.`,
      });
    }
  }

  return violations;
}

// Re-export sub-modules for direct access when needed
export { detectNegations, detectNegationPhrases } from './negation-detector';
export { assessRisk, deriveRiskLevel } from './risk-scorer';
export { classifyLSR } from './lsr-mapper';
export { generateRecommendations } from './recommendation-generator';
export { evaluateEscalationLikelihood, deriveEscalationTier } from './escalation-evaluator';
export type { NegationMatch } from './negation-detector';
export type { RiskAssessment } from './risk-scorer';
export type { LSRClassification } from './lsr-mapper';
