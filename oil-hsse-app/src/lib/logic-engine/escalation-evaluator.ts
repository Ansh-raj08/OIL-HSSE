// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Logic Engine: Escalation Likelihood Evaluator (TypeScript)
// Deterministic Rule-Based Heuristic Indicator (SIH26165)
// NOT a statistical prediction — rule-based operational factors
// ============================================================

import { EscalationLikelihood, EscalationTier, EscalationFactor } from '@/types/safety';

export function deriveEscalationTier(score: number): EscalationTier {
  if (score >= 75) return 'SEVERE';
  if (score >= 50) return 'HIGH';
  if (score >= 30) return 'MODERATE';
  return 'LOW';
}

export function evaluateEscalationLikelihood(params: {
  riskScore: number;
  riskLevel: string;
  highEnergyModifiers: string[];
  negationMatches: { phrase: string }[];
  validationStatus?: string;
  site?: string;
  lsrCode?: string;
  siteRepeatCount?: number;
}): EscalationLikelihood {
  const {
    riskScore,
    highEnergyModifiers = [],
    negationMatches = [],
    validationStatus = 'PENDING',
    site = '',
    lsrCode = '',
    siteRepeatCount = 0,
  } = params;

  const factors: EscalationFactor[] = [];
  let totalScore = 12; // Baseline operational exposure floor

  // 1. Unmitigated High-Energy Hazard Modifiers
  const heCount = highEnergyModifiers.length;
  if (heCount > 0) {
    const heWeight = Math.min(30, heCount * 15);
    totalScore += heWeight;
    factors.push({
      factor: 'High-Energy Hazard Modifiers',
      weight: heWeight,
      description: `${heCount} unmitigated high-energy hazard vector(s) identified (pressure, fall, toxic gas, suspended load).`,
    });
  }

  // 2. Site Repeat-Hazard Signal
  const highActivityKeywords = ['duliajan', 'moran', 'naharkatiya', 'digboi', 'kumchai'];
  const siteLower = site.toLowerCase();
  const isHighActivitySite = highActivityKeywords.some((k) => siteLower.includes(k));

  if (siteRepeatCount > 0 || isHighActivitySite) {
    const repeatWeight = siteRepeatCount > 0 ? 18 : 12;
    totalScore += repeatWeight;
    factors.push({
      factor: 'Site Precursor Recurrence',
      weight: repeatWeight,
      description: `Historical or active recurrence of ${lsrCode || 'precursor'} events logged at ${site || 'installation'}.`,
    });
  }

  // 3. Unreviewed Incident Aging Factor
  if (validationStatus === 'PENDING') {
    const pendingWeight = riskScore >= 60 ? 16 : 10;
    totalScore += pendingWeight;
    factors.push({
      factor: 'Unreviewed Aging Exposure',
      weight: pendingWeight,
      description: 'Incident remains in PENDING supervisory state without active confirmation or stop-work order.',
    });
  } else if (validationStatus === 'CONFIRMED') {
    factors.push({
      factor: 'Supervisory Containment Active',
      weight: -10,
      description: 'Formally confirmed by Chief HSSE Superintendent; field intervention dispatched.',
    });
    totalScore = Math.max(5, totalScore - 10);
  }

  // 4. Proximity to Next Severity Tier Cutoff
  let proximityWeight = 0;
  let proximityDesc = '';
  if (riskScore >= 24 && riskScore < 30) {
    proximityWeight = 12;
    proximityDesc = `Risk score (${riskScore}) is within 6 points of MEDIUM tier cutoff (30).`;
  } else if (riskScore >= 52 && riskScore < 60) {
    proximityWeight = 14;
    proximityDesc = `Risk score (${riskScore}) is within 8 points of HIGH tier cutoff (60).`;
  } else if (riskScore >= 72 && riskScore < 80) {
    proximityWeight = 18;
    proximityDesc = `Risk score (${riskScore}) is within 8 points of CRITICAL SIF precursor cutoff (80).`;
  } else if (riskScore >= 80) {
    proximityWeight = 10;
    proximityDesc = `Risk score (${riskScore}) exceeds CRITICAL cutoff; operating at maximum hazard regime.`;
  }

  if (proximityWeight > 0) {
    totalScore += proximityWeight;
    factors.push({
      factor: 'Severity Tier Boundary Proximity',
      weight: proximityWeight,
      description: proximityDesc,
    });
  }

  // 5. Density of Stacked Barrier Negations
  const negCount = negationMatches.length;
  if (negCount >= 2) {
    const negWeight = Math.min(25, negCount * 10);
    totalScore += negWeight;
    factors.push({
      factor: 'Compounding Barrier Negation Clauses',
      weight: negWeight,
      description: `${negCount} stacked barrier absence/negation clauses detected, indicating compounded defense-in-depth failure.`,
    });
  } else if (negCount === 1) {
    totalScore += 8;
    factors.push({
      factor: 'Isolated Barrier Deficit',
      weight: 8,
      description: '1 barrier negation clause identified in narrative.',
    });
  }

  const boundedScore = Math.min(Math.max(totalScore, 8), 96);
  const tier = deriveEscalationTier(boundedScore);

  const summary = `${tier} escalation likelihood (${boundedScore}/100) derived from ${factors.length} deterministic operational signals. Rule-based indicator, not a statistical prediction.`;

  return {
    score: boundedScore,
    tier,
    factors,
    summary,
  };
}
