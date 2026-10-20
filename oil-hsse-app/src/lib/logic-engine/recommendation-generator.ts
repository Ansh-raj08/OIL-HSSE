// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Logic Engine: Hierarchy-of-Controls Recommendation Generator
// ============================================================
//
// Generates recommended interventions following the industrial
// safety Hierarchy of Controls:
//   1. ELIMINATION — remove the hazard entirely
//   2. SUBSTITUTION — replace with less hazardous alternative
//   3. ENGINEERING — isolate people from the hazard
//   4. ADMINISTRATIVE — change the way people work
//   5. PPE — protect the worker
//
// Higher-level controls are preferred where appropriate.
// ============================================================

import type { HierarchyAction, LSRCode, RiskLevel } from '@/types/safety';

/**
 * Generates context-aware Hierarchy-of-Controls recommendations
 * based on the classified LSR and risk assessment.
 *
 * @param lsrCode - The matched Life-Saving Rule code
 * @param lsrTitle - The LSR title for message generation
 * @param isSifPrecursor - Whether the incident is a SIF precursor
 * @param site - The site name for context-specific messaging
 * @returns Ordered array of recommended control actions
 */
export function generateRecommendations(
  lsrCode: LSRCode,
  lsrTitle: string,
  isSifPrecursor: boolean,
  site: string
): HierarchyAction[] {
  const actions: HierarchyAction[] = [];

  // SIF precursors always get an immediate ELIMINATION action
  if (isSifPrecursor) {
    actions.push({
      order: 1,
      level: 'ELIMINATION',
      action: `Immediate Stop-Work Order issued for ${site} pending safety audit.`,
      urgency: 'IMMEDIATE',
    });
  }

  // LSR-specific recommendations
  const lsrRecommendations = LSR_RECOMMENDATIONS[lsrCode];
  if (lsrRecommendations) {
    lsrRecommendations.forEach((rec, index) => {
      actions.push({
        ...rec,
        order: actions.length + 1,
      });
    });
  }

  // Always include an administrative compliance verification
  actions.push({
    order: actions.length + 1,
    level: 'ADMINISTRATIVE',
    action: `Perform 100% compliance verification against ${lsrTitle}.`,
    urgency: 'IMMEDIATE',
  });

  // If no SIF and few recommendations, add a standard logging action
  if (!isSifPrecursor && actions.length <= 2) {
    actions.unshift({
      order: 1,
      level: 'ADMINISTRATIVE',
      action: `Record field observation in shift logbook and brief shift crew.`,
      urgency: 'SHORT_TERM',
    });
    // Re-number
    actions.forEach((a, i) => { a.order = i + 1; });
  }

  return actions;
}

/**
 * LSR-specific recommendation templates.
 * These are domain-informed, not generic AI-sounding text.
 */
const LSR_RECOMMENDATIONS: Partial<Record<LSRCode, Omit<HierarchyAction, 'order'>[]>> = {
  'LSR-01': [
    {
      level: 'ENGINEERING',
      action: 'Verify positive mechanical isolation with key-locked interlock on ESD valve.',
      urgency: 'IMMEDIATE',
    },
    {
      level: 'ADMINISTRATIVE',
      action: 'Audit isolation registers and re-certify LOTO procedure for all involved crews.',
      urgency: 'IMMEDIATE',
    },
  ],
  'LSR-02': [
    {
      level: 'ENGINEERING',
      action: 'Activate continuous forced-air ventilation and fixed gas detection at entry point.',
      urgency: 'IMMEDIATE',
    },
    {
      level: 'ADMINISTRATIVE',
      action: 'Enforce zero-entry policy until 4-gas test certifies O₂ ≥ 19.5% and H₂S < 5 ppm.',
      urgency: 'IMMEDIATE',
    },
    {
      level: 'PPE',
      action: 'Stage SCBA rescue unit and confirm standby attendant is in position.',
      urgency: 'IMMEDIATE',
    },
  ],
  'LSR-03': [
    {
      level: 'ENGINEERING',
      action: 'Install self-retracting lifeline (SRL) anchor point directly above work position.',
      urgency: 'SHORT_TERM',
    },
    {
      level: 'ADMINISTRATIVE',
      action: 'Conduct mandatory stand-down and 100% tie-off permit-to-work verification.',
      urgency: 'IMMEDIATE',
    },
    {
      level: 'PPE',
      action: 'Inspect full-body harness, dual energy-absorbing lanyards, and carabiners.',
      urgency: 'IMMEDIATE',
    },
  ],
  'LSR-04': [
    {
      level: 'ADMINISTRATIVE',
      action: 'Execute mandatory 4-gas atmosphere sweep (< 1% LEL) before resuming hot work.',
      urgency: 'IMMEDIATE',
    },
    {
      level: 'ADMINISTRATIVE',
      action: 'Station certified fire watchman with dry chemical powder extinguisher.',
      urgency: 'IMMEDIATE',
    },
  ],
  'LSR-05': [
    {
      level: 'ENGINEERING',
      action: 'Verify in-vehicle monitoring system (IVMS) telemetry, GPS tracking, and automatic speed governors on tanker fleet.',
      urgency: 'SHORT_TERM',
    },
    {
      level: 'ADMINISTRATIVE',
      action: 'Enforce approved Journey Management Plan (JMP), 100% seatbelt compliance check, and mandatory driver rest intervals.',
      urgency: 'IMMEDIATE',
    },
  ],
  'LSR-06': [
    {
      level: 'ENGINEERING',
      action: 'Install certified secondary retention cables, safety shackles, and whip-checks on all pressurized and dynamic connections.',
      urgency: 'IMMEDIATE',
    },
    {
      level: 'ADMINISTRATIVE',
      action: 'Establish and barricade strict exclusion zones around rotary table, tongs swing arc, cathead, and crane drop paths.',
      urgency: 'IMMEDIATE',
    },
    {
      level: 'PPE',
      action: 'Mandate heavy-duty impact-resistant gloves and metatarsal safety boots for all personnel working in active pinch-point areas.',
      urgency: 'IMMEDIATE',
    },
  ],
  'LSR-07': [
    {
      level: 'ENGINEERING',
      action: 'Activate explosion-proof forced mechanical ventilation on affected area.',
      urgency: 'IMMEDIATE',
    },
    {
      level: 'ADMINISTRATIVE',
      action: 'Perform bump test and calibrate all portable H₂S detectors before re-entry.',
      urgency: 'IMMEDIATE',
    },
    {
      level: 'PPE',
      action: 'Issue 30-minute SCBA units for personnel inspecting affected equipment.',
      urgency: 'IMMEDIATE',
    },
  ],
  'LSR-08': [
    {
      level: 'ENGINEERING',
      action: 'Restore safety interlock to operational status and verify via SCADA telemetry.',
      urgency: 'IMMEDIATE',
    },
    {
      level: 'ADMINISTRATIVE',
      action: 'Verify Safety Critical Element (SCE) status through management of change (MOC).',
      urgency: 'IMMEDIATE',
    },
  ],
  'LSR-09': [
    {
      level: 'ENGINEERING',
      action: 'Install physical barricades and optical warning lasers around lifting zone.',
      urgency: 'SHORT_TERM',
    },
    {
      level: 'ADMINISTRATIVE',
      action: 'Enforce minimum 6-meter tag lines on all tubular and equipment lifts.',
      urgency: 'IMMEDIATE',
    },
  ],
};
