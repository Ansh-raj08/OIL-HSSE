// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Phase 6: Logic Engine Calibration & Audit Test Suite (SIH26165)
// Tests: IOGP 9 Life-Saving Rules, Confined Space, Line of Fire,
//        Negation Preservation, SIF Thresholds & Tier Gradation
// ============================================================

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  analyzeNarrative,
  classifyLSR,
  assessRisk,
  deriveRiskLevel,
  detectNegations,
  generateRecommendations,
} from '../src/lib/logic-engine/analyzer';

describe('Logic Engine Phase 6 Audit & Calibration', () => {

  // ── 1. IOGP Life-Saving Rules Complete Coverage ───────────────
  describe('1. IOGP Life-Saving Rules Complete Coverage', () => {
    
    it('LSR-01: Energy Isolation / LOTO classified correctly', () => {
      const narrative = 'Technician started maintenance on manifold without verifying LOTO depressurization to 0 psi.';
      const result = classifyLSR(narrative);
      assert.strictEqual(result.code, 'LSR-01');
      assert.strictEqual(result.matchType, 'RULE_MATCHED');
    });

    it('LSR-02: Confined Space Entry classified correctly (CONFIRMED PRESENT)', () => {
      const narrative = 'Contractor entered crude oil storage tank for internal inspection without confined space entry permit or hole watch attendant.';
      const result = classifyLSR(narrative);
      assert.strictEqual(result.code, 'LSR-02');
      assert.strictEqual(result.matchType, 'RULE_MATCHED');
      assert.match(result.title, /Confined Space/i);
    });

    it('LSR-02: Confined Space sump pit and mud tank variants', () => {
      const narrative = 'Roustabout descended into mud pit sump without atmospheric testing for oxygen deficiency.';
      const result = classifyLSR(narrative);
      assert.strictEqual(result.code, 'LSR-02');
    });

    it('LSR-03: Working at Height classified correctly', () => {
      const narrative = 'Driller observed on monkey board at 12 meters height without 100% tie-off harness.';
      const result = classifyLSR(narrative);
      assert.strictEqual(result.code, 'LSR-03');
      assert.strictEqual(result.matchType, 'RULE_MATCHED');
    });

    it('LSR-04: Hot Work classified correctly', () => {
      const narrative = 'Grinding and torch cutting initiated near crude separator with combustible hydrocarbon vapor present.';
      const result = classifyLSR(narrative);
      assert.strictEqual(result.code, 'LSR-04');
      assert.strictEqual(result.matchType, 'RULE_MATCHED');
    });

    it('LSR-05: Driving & Vehicle Safety classified correctly', () => {
      const narrative = 'Crude water bowser truck observed speeding at 75 km/h on access road, driver not wearing seatbelt.';
      const result = classifyLSR(narrative);
      assert.strictEqual(result.code, 'LSR-05');
      assert.strictEqual(result.matchType, 'RULE_MATCHED');
    });

    it('LSR-06: Line of Fire & Dropped Objects classified correctly (CONFIRMED PRESENT)', () => {
      const narrative = 'Floorman positioned in line of fire while make-up tongs were swinging under tension. No whip check on pressurized hose.';
      const result = classifyLSR(narrative);
      assert.strictEqual(result.code, 'LSR-06');
      assert.strictEqual(result.matchType, 'RULE_MATCHED');
      assert.match(result.title, /Line of Fire/i);
    });

    it('LSR-06: Line of Fire drop zone and high-tension whip variants', () => {
      const narrative = 'Worker entered barricaded drop zone under derrick while heavy wrench slipped from monkey board.';
      const result = classifyLSR(narrative);
      assert.strictEqual(result.code, 'LSR-06');
    });

    it('LSR-07: H2S / Toxic Gas Exposure classified correctly', () => {
      const narrative = 'Personal H2S monitor alarmed at 15 ppm near wellhead, employee evacuated without EEBA breathing apparatus.';
      const result = classifyLSR(narrative);
      assert.strictEqual(result.code, 'LSR-07');
      assert.strictEqual(result.matchType, 'RULE_MATCHED');
    });

    it('LSR-08: Bypassing Safety Controls classified correctly', () => {
      const narrative = 'Instrument tech bypassed high-pressure safety interlock on separator to prevent production trip without MOC.';
      const result = classifyLSR(narrative);
      assert.strictEqual(result.code, 'LSR-08');
      assert.strictEqual(result.matchType, 'RULE_MATCHED');
    });

    it('LSR-09: Mechanical Lifting Operations classified correctly', () => {
      const narrative = 'Mobile crane lifting heavy 9-5/8 casing bundle without tag lines, load swinging towards personnel.';
      const result = classifyLSR(narrative);
      assert.strictEqual(result.code, 'LSR-09');
      assert.strictEqual(result.matchType, 'RULE_MATCHED');
    });
  });

  // ── 2. Negation Detection & Preservation Calibration ───────────
  describe('2. Safety Negation Phrase Detection', () => {

    it('Detects multiple distinct negation clauses in single narrative', () => {
      const narrative = 'Roughneck worked at height without safety harness and tie-off was not maintained. Missing secondary lanyard.';
      const negations = detectNegations(narrative);
      assert.ok(negations.length >= 2, `Expected at least 2 negations, found ${negations.length}`);
      
      const phrases = negations.map(n => n.phrase.toLowerCase());
      assert.ok(phrases.some(p => p.includes('without safety harness')));
      assert.ok(phrases.some(p => p.includes('not maintained')));
    });

    it('Distinguishes compliant positive phrasing from safety violations', () => {
      const positiveNarrative = 'Worker inspected monkey board with full safety harness and lanyard securely attached.';
      const negations = detectNegations(positiveNarrative);
      assert.strictEqual(negations.length, 0, 'Positive compliance phrasing should produce 0 negations');
    });

    it('Detects upstream-specific negation tokens: missing, bypassed, failed to, unauthorized', () => {
      const narrative = 'Crew proceeded with unauthorized vessel entry, missing gas detector, and bypassed ESD trip.';
      const negations = detectNegations(narrative);
      assert.ok(negations.length >= 2);
    });
  });

  // ── 3. Deterministic Risk Scoring & SIF Precursor Calibration ──
  describe('3. Risk Scorer Calibration & SIF Precursor Threshold', () => {

    it('High-energy hazard + compromised barrier qualifies as SIF Precursor (score >= 65, CRITICAL >= 80)', () => {
      const narrative = 'Roustabout observed working at 8 meters height on monkey board without safety harness attached. Tie-off was not maintained.';
      const risk = assessRisk(narrative);
      assert.ok(risk.isSifPrecursor, 'High-energy fall potential with dual negations must be SIF precursor');
      assert.strictEqual(risk.level, 'CRITICAL');
      assert.ok(risk.score >= 80, `Expected score >= 80, got ${risk.score}`);
    });

    it('Extreme multi-hazard event receives 90+ saturation gradation', () => {
      const narrative = 'High pressure gas kick at 1200 psi encountered. ESD valve bypassed by operator, well not shut in, and H2S leak alarm active without breathing apparatus.';
      const risk = assessRisk(narrative);
      assert.strictEqual(risk.level, 'CRITICAL');
      assert.ok(risk.score >= 90, `Expected 90+ score for catastrophic multi-vector event, got ${risk.score}`);
    });

    it('Moderate violation without high-energy escalation scores in HIGH tier (60-79)', () => {
      const narrative = 'Truck driver operated light utility pickup truck without seatbelt fastened during routine daytime transit on lease road.';
      const risk = assessRisk(narrative);
      assert.ok(risk.score >= 60 && risk.score < 80, `Expected score between 60 and 79, got ${risk.score}`);
      assert.strictEqual(risk.level, 'HIGH');
    });

    it('Substandard condition without immediate life threat scores in MEDIUM tier (30-59)', () => {
      const narrative = 'Minor oil seepage observed around secondary flange valve packing. No active pressure release.';
      const risk = assessRisk(narrative);
      assert.ok(risk.score >= 30 && risk.score < 60, `Expected score between 30 and 59, got ${risk.score}`);
      assert.strictEqual(risk.level, 'MEDIUM');
    });

    it('Routine compliant observation scores in LOW tier (< 30)', () => {
      const narrative = 'Routine housekeeping shift handover completed. Rig floor clear of mud and tools stored in designated racks.';
      const risk = assessRisk(narrative);
      assert.ok(risk.score < 30, `Expected score < 30 for routine housekeeping, got ${risk.score}`);
      assert.strictEqual(risk.level, 'LOW');
      assert.strictEqual(risk.isSifPrecursor, false);
    });
  });

  // ── 4. Hierarchy-of-Controls Recommendations Calibration ──────
  describe('4. Hierarchy-of-Controls Recommendations', () => {

    it('SIF Precursor triggers immediate ELIMINATION Stop-Work Order', () => {
      const actions = generateRecommendations('LSR-02', 'LSR-02: Confined Space Entry', true, 'Moran GGS #3');
      assert.ok(actions.length >= 3);
      assert.strictEqual(actions[0].level, 'ELIMINATION');
      assert.match(actions[0].action, /Stop-Work Order/i);
      assert.strictEqual(actions[0].urgency, 'IMMEDIATE');
    });

    it('Confined Space recommendations include atmospheric testing and standby watch', () => {
      const actions = generateRecommendations('LSR-02', 'LSR-02: Confined Space Entry', true, 'Digboi CTF');
      const actionTexts = actions.map(a => a.action.toLowerCase()).join(' ');
      assert.ok(actionTexts.includes('ventilation') || actionTexts.includes('gas test') || actionTexts.includes('o₂'));
    });

    it('Line of Fire recommendations include exclusion zone and secondary retention', () => {
      const actions = generateRecommendations('LSR-06', 'LSR-06: Line of Fire & Dropped Objects', true, 'Duliajan Rig #7');
      const actionTexts = actions.map(a => a.action.toLowerCase()).join(' ');
      assert.ok(actionTexts.includes('exclusion zone') || actionTexts.includes('retention') || actionTexts.includes('barricade'));
    });
  });

  // ── 5. End-to-End Unified Pipeline Integration ─────────────────
  describe('5. Unified Pipeline analyzeNarrative Integration', () => {

    it('Produces complete SIF analysis with XAI triggers and LSR violations for Confined Space', () => {
      const narrative = 'Worker entered slug catcher vessel without gas test certification or continuous forced-air ventilation. Sump unventilated.';
      const analysis = analyzeNarrative(narrative, 'Dikom CTF');
      
      assert.strictEqual(analysis.lsr.code, 'LSR-02');
      assert.strictEqual(analysis.isSifPrecursor, true);
      assert.ok(analysis.xaiTriggers.length > 0);
      assert.ok(analysis.lsrViolations.length > 0);
      assert.strictEqual(analysis.lsrViolations[0].code, 'LSR-02');
      assert.ok(analysis.hierarchyActions.length >= 3);
    });

    it('Produces complete SIF analysis for Line of Fire dropped object incident', () => {
      const narrative = 'Heavy drill collar swung in line of fire across rotary table without tag line control. Rig floor exclusion zone breached.';
      const analysis = analyzeNarrative(narrative, 'Borbil Wellsite #04');
      
      assert.strictEqual(analysis.lsr.code, 'LSR-06');
      assert.ok(analysis.risk.score >= 65);
      assert.strictEqual(analysis.isSifPrecursor, true);
      assert.ok(analysis.xaiTriggers.some(t => t.isNegation || t.weight >= 0.8));
    });
  });
});
