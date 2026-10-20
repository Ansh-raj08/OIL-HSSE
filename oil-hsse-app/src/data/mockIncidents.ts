// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Synthetic Upstream Oil & Gas Incidents (Prompt v2.0)
// ============================================================

import { SafetyIncident } from '@/types/safety';
import { evaluateEscalationLikelihood } from '@/lib/logic-engine/analyzer';

const RAW_MOCK_INCIDENTS: SafetyIncident[] = [
  {
    id: 'OIL-2026-1042',
    timestamp: '2026-09-11 08:35 IST',
    site: 'Duliajan Rig #7 (Drilling Ops)',
    basin: 'Assam Operational Basin',
    reportedBy: 'P. Phukan (Lead Toolpusher)',
    category: 'UNSAFE_ACT',
    rawNarrative:
      'During casing running operation at 08:20 hrs, roustabout was observed working on the monkey board at 8 meters height without secondary lanyard attached. Strong gusts of wind (28 knots) were recorded. 100% tie-off was not maintained while transitioning between pipe fingers.',
    truncatedNarrative:
      'Roustabout working at 8m on monkey board without secondary lanyard attached. Wind 28 kts, tie-off not maintained...',
    riskScore: 94,
    riskLevel: 'CRITICAL',
    isSifPrecursor: true,
    lsrCategory: 'LSR-03',
    lsrTitle: 'LSR-03: Working at Height',
    lsrViolations: [
      {
        code: 'LSR-03',
        label: 'Working at Height',
        description: 'Failure to maintain 100% tie-off above 1.8m with dual lanyard system.',
      },
    ],
    xaiTriggers: [
      {
        token: 'without secondary lanyard',
        weight: 0.96,
        context: 'working on monkey board at 8m without secondary lanyard attached',
        isNegation: true,
      },
      {
        token: '8 meters height',
        weight: 0.91,
        context: 'at 8 meters height without secondary lanyard',
        isNegation: false,
      },
      {
        token: 'not maintained',
        weight: 0.88,
        context: '100% tie-off was not maintained while transitioning',
        isNegation: true,
      },
      {
        token: 'monkey board',
        weight: 0.84,
        context: 'roustabout observed working on the monkey board',
        isNegation: false,
      },
    ],
    hierarchyActions: [
      {
        order: 1,
        level: 'ELIMINATION',
        action: 'Immediate Stop-Work Order on monkey board operations until fall arrest is re-verified.',
        urgency: 'IMMEDIATE',
      },
      {
        order: 2,
        level: 'ENGINEERING',
        action: 'Install inertia reel self-retracting lifeline (SRL) anchor directly above monkey board.',
        urgency: 'SHORT_TERM',
      },
      {
        order: 3,
        level: 'ADMINISTRATIVE',
        action: 'Conduct mandatory stand-down and 100% tie-off permit-to-work verification for Derrick crew.',
        urgency: 'IMMEDIATE',
      },
      {
        order: 4,
        level: 'PPE',
        action: 'Inspect full-body harness, dual energy-absorbing shock lanyards, and carabiners.',
        urgency: 'IMMEDIATE',
      },
    ],
    validationStatus: 'PENDING',
  },
  {
    id: 'OIL-2026-1041',
    timestamp: '2026-09-11 07:15 IST',
    site: 'Moran Gas Gathering Station (GGS #3)',
    basin: 'Assam Operational Basin',
    reportedBy: 'K. Gogoi (Production Engineer)',
    category: 'UNSAFE_CONDITION',
    rawNarrative:
      'Contractor technician bypassed lockout/tagout (LOTO) mechanical interlock on high-pressure test manifold (3,500 psi). Line was not depressurized before flange unbolting and no isolation certificate was affixed to the ESD valve.',
    truncatedNarrative:
      'Contractor bypassed LOTO interlock on 3,500 psi manifold. Line not depressurized, no isolation certificate...',
    riskScore: 91,
    riskLevel: 'CRITICAL',
    isSifPrecursor: true,
    lsrCategory: 'LSR-01',
    lsrTitle: 'LSR-01: Energy Isolation / LOTO',
    lsrViolations: [
      {
        code: 'LSR-01',
        label: 'Energy Isolation / LOTO',
        description: 'Attempting maintenance on pressurized manifold without positive mechanical isolation.',
      },
      {
        code: 'LSR-08',
        label: 'Bypassing Safety Controls',
        description: 'Safety interlock bypassed without formal management of change (MOC) override.',
      },
    ],
    xaiTriggers: [
      {
        token: 'bypassed lockout/tagout',
        weight: 0.95,
        context: 'technician bypassed lockout/tagout (LOTO) mechanical interlock',
        isNegation: false,
      },
      {
        token: 'not depressurized',
        weight: 0.93,
        context: 'Line was not depressurized before flange unbolting',
        isNegation: true,
      },
      {
        token: '3,500 psi',
        weight: 0.9,
        context: 'high-pressure test manifold (3,500 psi)',
        isNegation: false,
      },
      {
        token: 'no isolation certificate',
        weight: 0.86,
        context: 'and no isolation certificate was affixed to ESD valve',
        isNegation: true,
      },
    ],
    hierarchyActions: [
      {
        order: 1,
        level: 'ELIMINATION',
        action: 'Depressurize manifold and bleed down to 0 psi through flare scrubber header.',
        urgency: 'IMMEDIATE',
      },
      {
        order: 2,
        level: 'ENGINEERING',
        action: 'Install key-locked mechanical captive-interlock system on manifold inlet ESD valve.',
        urgency: 'SHORT_TERM',
      },
      {
        order: 3,
        level: 'ADMINISTRATIVE',
        action: 'Audit isolation registers and re-certify mechanical lock-out procedure for third-party crew.',
        urgency: 'IMMEDIATE',
      },
    ],
    validationStatus: 'PENDING',
  },
  {
    id: 'OIL-2026-1039',
    timestamp: '2026-09-10 22:40 IST',
    site: 'Naharkatiya Well #114 (Workover Unit #2)',
    basin: 'Assam Operational Basin',
    reportedBy: 'A. Saikia (HSSE Officer)',
    category: 'NEAR_MISS',
    rawNarrative:
      'Fixed sensor detected 18 ppm H2S release during tripping out of hole near the shale shaker pit. Two mud technicians were working without personal gas monitors and without emergency escape breathing apparatus (EEBA) staged within arm reach.',
    truncatedNarrative:
      '18 ppm H2S detected near mud shakers. Technicians working without personal gas monitors and without EEBA...',
    riskScore: 88,
    riskLevel: 'CRITICAL',
    isSifPrecursor: true,
    lsrCategory: 'LSR-07',
    lsrTitle: 'LSR-07: H₂S / Toxic Gas Exposure',
    lsrViolations: [
      {
        code: 'LSR-07',
        label: 'H₂S / Toxic Gas Exposure',
        description: 'Personnel in sour gas zone without calibrated 4-gas detectors and EEBA packs.',
      },
    ],
    xaiTriggers: [
      {
        token: '18 ppm H2S',
        weight: 0.94,
        context: 'Fixed sensor detected 18 ppm H2S release during tripping out',
        isNegation: false,
      },
      {
        token: 'without personal gas monitors',
        weight: 0.92,
        context: 'technicians were working without personal gas monitors',
        isNegation: true,
      },
      {
        token: 'without emergency escape breathing apparatus',
        weight: 0.89,
        context: 'and without emergency escape breathing apparatus (EEBA)',
        isNegation: true,
      },
    ],
    hierarchyActions: [
      {
        order: 1,
        level: 'ELIMINATION',
        action: 'Evacuate shaker pit immediately upwind to designated muster point Delta.',
        urgency: 'IMMEDIATE',
      },
      {
        order: 2,
        level: 'ENGINEERING',
        action: 'Activate auxiliary explosion-proof forced mechanical exhaust ventilation on mud ditches.',
        urgency: 'IMMEDIATE',
      },
      {
        order: 3,
        level: 'ADMINISTRATIVE',
        action: 'Perform bump test and calibrate all portable single-gas H₂S detectors before re-entry.',
        urgency: 'IMMEDIATE',
      },
      {
        order: 4,
        level: 'PPE',
        action: 'Issue 30-minute SCBA units for mud engineers inspecting degasser units.',
        urgency: 'IMMEDIATE',
      },
    ],
    validationStatus: 'CONFIRMED',
    reviewedBy: 'T. Baruah (Chief HSSE Supt.)',
    reviewedAt: '2026-09-10 23:10 IST',
    escalationNotes: 'Incident escalated to Drilling Operations GM. Mud circulation halted for gas degasser flush.',
  },
  {
    id: 'OIL-2026-1036',
    timestamp: '2026-09-10 16:20 IST',
    site: 'Digboi Central Tank Farm (Crude CTF)',
    basin: 'Assam Operational Basin',
    reportedBy: 'B. Hazarika (Shift Chemist)',
    category: 'UNSAFE_ACT',
    rawNarrative:
      'Contract welder attempted hot work grinding on live crude oil storage tank #12 roof nozzle without hot work permit and without explosive gas check. LEL monitor was not present within the 15-meter hot zone.',
    truncatedNarrative:
      'Hot work grinding on live crude tank #12 nozzle without hot work permit and without explosive gas check...',
    riskScore: 86,
    riskLevel: 'CRITICAL',
    isSifPrecursor: true,
    lsrCategory: 'LSR-04',
    lsrTitle: 'LSR-04: Hot Work',
    lsrViolations: [
      {
        code: 'LSR-04',
        label: 'Hot Work',
        description: 'Hot work initiated within explosive vapor zone without valid PTW or combustible gas testing.',
      },
    ],
    xaiTriggers: [
      {
        token: 'without hot work permit',
        weight: 0.93,
        context: 'grinding on live crude oil storage tank roof nozzle without hot work permit',
        isNegation: true,
      },
      {
        token: 'without explosive gas check',
        weight: 0.91,
        context: 'and without explosive gas check',
        isNegation: true,
      },
      {
        token: 'was not present',
        weight: 0.85,
        context: 'LEL monitor was not present within 15-meter hot zone',
        isNegation: true,
      },
    ],
    hierarchyActions: [
      {
        order: 1,
        level: 'ELIMINATION',
        action: 'Confiscate grinding tools and suspend contractor hot work badge immediately.',
        urgency: 'IMMEDIATE',
      },
      {
        order: 2,
        level: 'ADMINISTRATIVE',
        action: 'Execute mandatory 4-gas atmosphere sweep (< 1% LEL requirement) before resuming maintenance.',
        urgency: 'IMMEDIATE',
      },
      {
        order: 3,
        level: 'ADMINISTRATIVE',
        action: 'Station certified fire watchman with 50kg dry chemical powder cart.',
        urgency: 'IMMEDIATE',
      },
    ],
    validationStatus: 'PENDING',
  },
  {
    id: 'OIL-2026-1033',
    timestamp: '2026-09-10 11:45 IST',
    site: 'Kumchai Exploratory Drilling Rig #2',
    basin: 'Arunachal Sub-Basin',
    reportedBy: 'D. Kalita (Rig Crane Operator)',
    category: 'NEAR_MISS',
    rawNarrative:
      'Crawler crane was swinging 4.2-ton blowout preventer (BOP) stack section over the sub-structure. Rigger entered the red exclusion zone directly under the suspended load without tag line control and without eye contact with crane operator.',
    truncatedNarrative:
      'Rigger entered exclusion zone directly under suspended 4.2t BOP load without tag lines or eye contact...',
    riskScore: 84,
    riskLevel: 'CRITICAL',
    isSifPrecursor: true,
    lsrCategory: 'LSR-09',
    lsrTitle: 'LSR-09: Mechanical Lifting Operations',
    lsrViolations: [
      {
        code: 'LSR-09',
        label: 'Mechanical Lifting Operations',
        description: 'Personnel positioned beneath active suspended load without tag line distance.',
      },
      {
        code: 'LSR-06',
        label: 'Line of Fire & Dropped Objects',
        description: 'Breaching marked dynamic drop zone perimeter.',
      },
    ],
    xaiTriggers: [
      {
        token: 'under the suspended load',
        weight: 0.94,
        context: 'rigger entered the red exclusion zone directly under the suspended load',
        isNegation: false,
      },
      {
        token: 'without tag line control',
        weight: 0.9,
        context: 'without tag line control and without eye contact with operator',
        isNegation: true,
      },
      {
        token: '4.2-ton',
        weight: 0.82,
        context: 'swinging 4.2-ton blowout preventer (BOP) stack section',
        isNegation: false,
      },
    ],
    hierarchyActions: [
      {
        order: 1,
        level: 'ELIMINATION',
        action: 'Land load onto wooden cribbing immediately and cease crane slewing.',
        urgency: 'IMMEDIATE',
      },
      {
        order: 2,
        level: 'ENGINEERING',
        action: 'Install physical rigid barricades and optical warning lasers around rig floor drop zone.',
        urgency: 'SHORT_TERM',
      },
      {
        order: 3,
        level: 'ADMINISTRATIVE',
        action: 'Enforce non-conductive minimum 6-meter tag lines on all tubular and BOP lifts.',
        urgency: 'IMMEDIATE',
      },
    ],
    validationStatus: 'PENDING',
  },
  {
    id: 'OIL-2026-1028',
    timestamp: '2026-09-09 19:10 IST',
    site: 'Shalmari Production Well #18',
    basin: 'Assam Operational Basin',
    reportedBy: 'R. Bora (Field Operator)',
    category: 'UNSAFE_CONDITION',
    rawNarrative:
      'High-pressure separator emergency pressure relief valve (PRV-201) hand-wheel lock was broken. Bypass line isolation gate valve was found half-open without authorization tag or lock.',
    truncatedNarrative:
      'Separator PRV hand-wheel lock broken. Bypass isolation valve found half-open without authorization...',
    riskScore: 78,
    riskLevel: 'HIGH',
    isSifPrecursor: true,
    lsrCategory: 'LSR-08',
    lsrTitle: 'LSR-08: Bypassing Safety Controls',
    lsrViolations: [
      {
        code: 'LSR-08',
        label: 'Bypassing Safety Controls',
        description: 'Safety critical element (SCE) isolation tampered without approved MOC.',
      },
    ],
    xaiTriggers: [
      {
        token: 'without authorization tag',
        weight: 0.88,
        context: 'found half-open without authorization tag or lock',
        isNegation: true,
      },
      {
        token: 'lock was broken',
        weight: 0.85,
        context: 'emergency pressure relief valve hand-wheel lock was broken',
        isNegation: false,
      },
    ],
    hierarchyActions: [
      {
        order: 1,
        level: 'ENGINEERING',
        action: 'Re-lock PRV hand-wheel in open position using car-seal chain lock.',
        urgency: 'IMMEDIATE',
      },
      {
        order: 2,
        level: 'ADMINISTRATIVE',
        action: 'Verify Safety Critical Element (SCE) status with central SCADA telemetry.',
        urgency: 'IMMEDIATE',
      },
    ],
    validationStatus: 'CONFIRMED',
    reviewedBy: 'T. Baruah (Chief HSSE Supt.)',
    reviewedAt: '2026-09-09 20:00 IST',
  },
  {
    id: 'OIL-2026-1025',
    timestamp: '2026-09-09 14:05 IST',
    site: 'Dikom Central Tank Farm (Dikom CTF)',
    basin: 'Assam Operational Basin',
    reportedBy: 'S. Neog (Maintenance Supervisor)',
    category: 'UNSAFE_ACT',
    rawNarrative:
      'Contractor personnel entered crude oil transfer pit (depth 2.4m) to inspect sump pump without confined space entry permit. No continuous gas monitoring or mechanical forced air blower was running.',
    truncatedNarrative:
      'Personnel entered 2.4m pit without confined space permit. No gas test or blower active...',
    riskScore: 76,
    riskLevel: 'HIGH',
    isSifPrecursor: true,
    lsrCategory: 'LSR-02',
    lsrTitle: 'LSR-02: Confined Space Entry',
    lsrViolations: [
      {
        code: 'LSR-02',
        label: 'Confined Space Entry',
        description: 'Entry into sub-grade sump pit without atmospheric test or entry attendant.',
      },
    ],
    xaiTriggers: [
      {
        token: 'without confined space entry permit',
        weight: 0.91,
        context: 'entered crude oil transfer pit to inspect sump pump without confined space entry permit',
        isNegation: true,
      },
      {
        token: 'No continuous gas monitoring',
        weight: 0.87,
        context: 'No continuous gas monitoring or mechanical forced air blower was running',
        isNegation: true,
      },
    ],
    hierarchyActions: [
      {
        order: 1,
        level: 'ELIMINATION',
        action: 'Order workers to evacuate sump pit immediately.',
        urgency: 'IMMEDIATE',
      },
      {
        order: 2,
        level: 'ADMINISTRATIVE',
        action: 'Enforce zero-entry policy until 4-gas test certifies oxygen >= 19.5% and H2S < 5 ppm.',
        urgency: 'IMMEDIATE',
      },
    ],
    validationStatus: 'PENDING',
  },
  {
    id: 'OIL-2026-1020',
    timestamp: '2026-09-08 17:30 IST',
    site: 'Borbil Wellsite #04 (Drilling)',
    basin: 'Assam Operational Basin',
    reportedBy: 'H. Sarmah (Safety Inspector)',
    category: 'UNSAFE_CONDITION',
    rawNarrative:
      'Rig transport flatbed trailer carrying drill pipes was operated on unpaved bypass road without pilot escort vehicle. Driver was found not wearing seatbelt and driving at 45 km/h where max posted speed was 20 km/h.',
    truncatedNarrative:
      'Trailer carrying pipes operated on bypass road without pilot escort. Driver not wearing seatbelt...',
    riskScore: 68,
    riskLevel: 'HIGH',
    isSifPrecursor: false,
    lsrCategory: 'LSR-05',
    lsrTitle: 'LSR-05: Driving & Vehicle Safety',
    lsrViolations: [
      {
        code: 'LSR-05',
        label: 'Driving & Vehicle Safety',
        description: 'Excessive speed in field zone and failure to wear primary restraint seatbelt.',
      },
    ],
    xaiTriggers: [
      {
        token: 'without pilot escort',
        weight: 0.78,
        context: 'operated on unpaved bypass road without pilot escort vehicle',
        isNegation: true,
      },
      {
        token: 'not wearing seatbelt',
        weight: 0.84,
        context: 'Driver was found not wearing seatbelt and driving at 45 km/h',
        isNegation: true,
      },
    ],
    hierarchyActions: [
      {
        order: 1,
        level: 'ADMINISTRATIVE',
        action: 'Issue formal speeding citation and revoke internal driving permit for 14 days.',
        urgency: 'IMMEDIATE',
      },
    ],
    validationStatus: 'OVERRIDDEN',
    reviewedBy: 'T. Baruah (Chief HSSE Supt.)',
    reviewedAt: '2026-09-08 18:45 IST',
    overrideJustification:
      'Vehicle was on private secondary access road under 15 km/h during actual cornering. Re-classified from SIF precursor to standard transport non-conformance.',
  },
  {
    id: 'OIL-2026-1017',
    timestamp: '2026-09-08 11:15 IST',
    site: 'Duliajan Central Workshop',
    basin: 'Assam Operational Basin',
    reportedBy: 'M. Chetia (Workshop Foreman)',
    category: 'UNSAFE_CONDITION',
    rawNarrative:
      'Overhead gantry crane hook latch safety pin was bent and failed to spring back to closed position. Cable drum displayed light surface oxidation but wire rope strands remained fully intact with no broken wires.',
    truncatedNarrative:
      'Overhead crane hook latch pin bent, failed to close. Wire rope strands intact with no broken wires...',
    riskScore: 48,
    riskLevel: 'MEDIUM',
    isSifPrecursor: false,
    lsrCategory: 'LSR-09',
    lsrTitle: 'LSR-09: Mechanical Lifting Operations',
    lsrViolations: [],
    xaiTriggers: [
      {
        token: 'hook latch safety pin bent',
        weight: 0.58,
        context: 'crane hook latch safety pin was bent and failed to spring back',
        isNegation: false,
      },
      {
        token: 'no broken wires',
        weight: 0.2,
        context: 'rope strands remained fully intact with no broken wires',
        isNegation: true,
      },
    ],
    hierarchyActions: [
      {
        order: 1,
        level: 'ENGINEERING',
        action: 'Replace hook safety latch assembly with certified forged spring latch.',
        urgency: 'SHORT_TERM',
      },
    ],
    validationStatus: 'CONFIRMED',
  },
  {
    id: 'OIL-2026-1012',
    timestamp: '2026-09-07 15:40 IST',
    site: 'Naharkatiya Crude Oil Pumping Station #1',
    basin: 'Assam Operational Basin',
    reportedBy: 'J. Das (Pump Station Tech)',
    category: 'UNSAFE_CONDITION',
    rawNarrative:
      'Secondary containment sump bund wall showed small hairline mortar crack on south perimeter. Minor oily water residue visible inside bund, but containment capacity not compromised and no leak outside perimeter was detected.',
    truncatedNarrative:
      'Hairline crack on pump station bund wall. Oily residue inside, but capacity not compromised...',
    riskScore: 32,
    riskLevel: 'MEDIUM',
    isSifPrecursor: false,
    lsrCategory: 'LSR-08',
    lsrTitle: 'LSR-08: Bypassing Safety Controls',
    lsrViolations: [],
    xaiTriggers: [
      {
        token: 'not compromised',
        weight: 0.15,
        context: 'containment capacity not compromised',
        isNegation: true,
      },
      {
        token: 'no leak outside perimeter',
        weight: 0.12,
        context: 'and no leak outside perimeter was detected',
        isNegation: true,
      },
    ],
    hierarchyActions: [
      {
        order: 1,
        level: 'ENGINEERING',
        action: 'Apply chemical sealant and hydrostatic barrier mortar over hairline joint.',
        urgency: 'LONG_TERM',
      },
    ],
    validationStatus: 'CONFIRMED',
  },
  {
    id: 'OIL-2026-1008',
    timestamp: '2026-09-07 09:30 IST',
    site: 'Duliajan Rig #7 (Drilling Ops)',
    basin: 'Assam Operational Basin',
    reportedBy: 'A. Saikia (HSSE Officer)',
    category: 'UNSAFE_ACT',
    rawNarrative:
      'Routine pre-shift derrick inspection completed. All fall arrest lanyards, inertia reels, and anchor harnesses inspected by safety marshal with zero tears and no corrosion noted. Harness tags valid until Dec 2026.',
    truncatedNarrative:
      'Routine pre-shift derrick inspection. All fall arrest lanyards inspected with zero tears and no corrosion...',
    riskScore: 12,
    riskLevel: 'LOW',
    isSifPrecursor: false,
    lsrCategory: 'LSR-03',
    lsrTitle: 'LSR-03: Working at Height',
    lsrViolations: [],
    xaiTriggers: [
      {
        token: 'zero tears',
        weight: 0.05,
        context: 'inspected by safety marshal with zero tears',
        isNegation: true,
      },
      {
        token: 'no corrosion noted',
        weight: 0.04,
        context: 'and no corrosion noted. Tags valid.',
        isNegation: true,
      },
    ],
    hierarchyActions: [
      {
        order: 1,
        level: 'ADMINISTRATIVE',
        action: 'Log inspection logbook entry and issue daily green permit tag.',
        urgency: 'LONG_TERM',
      },
    ],
    validationStatus: 'CONFIRMED',
  },
  {
    id: 'OIL-2026-1003',
    timestamp: '2026-09-06 14:10 IST',
    site: 'Moran Gas Gathering Station (GGS #3)',
    basin: 'Assam Operational Basin',
    reportedBy: 'K. Gogoi (Production Engineer)',
    category: 'NEAR_MISS',
    rawNarrative:
      'Annual relief valve bench calibration concluded successfully for Separator V-101. Certified test gauge confirmed pop pressure at 1,200 psig (+/- 1%). No leaks, seat pass, or chatter detected during three test cycles.',
    truncatedNarrative:
      'Annual relief valve calibration successful for Separator V-101. No leaks, seat pass, or chatter detected...',
    riskScore: 8,
    riskLevel: 'LOW',
    isSifPrecursor: false,
    lsrCategory: 'LSR-01',
    lsrTitle: 'LSR-01: Energy Isolation / LOTO',
    lsrViolations: [],
    xaiTriggers: [
      {
        token: 'No leaks',
        weight: 0.02,
        context: 'No leaks, seat pass, or chatter detected',
        isNegation: true,
      },
    ],
    hierarchyActions: [
      {
        order: 1,
        level: 'ADMINISTRATIVE',
        action: 'Update SAP maintenance management record and affix annual inspection seal.',
        urgency: 'LONG_TERM',
      },
    ],
    validationStatus: 'CONFIRMED',
  },
];

export const MOCK_INCIDENTS: SafetyIncident[] = RAW_MOCK_INCIDENTS.map((inc) => ({
  ...inc,
  datasetId: inc.datasetId || 'ds-01',
  escalationLikelihood:
    inc.escalationLikelihood ||
    evaluateEscalationLikelihood({
      riskScore: inc.riskScore,
      riskLevel: inc.riskLevel,
      highEnergyModifiers: [],
      negationMatches: (inc.xaiTriggers || [])
        .filter((t) => t.isNegation)
        .map((t) => ({ phrase: t.token })),
      validationStatus: inc.validationStatus,
      site: inc.site,
      lsrCode: inc.lsrCategory,
    }),
}));

// Pre-filled simulation templates for the Ingestion Modal
export const DEMO_PREFILL_SCENARIOS = [
  {
    title: 'Duliajan Rig #7: Monkey Board Fall Hazard',
    site: 'Duliajan Rig #7 (Drilling Ops)',
    category: 'UNSAFE_ACT' as const,
    narrative:
      'During casing running at 8 meters height, roustabout was observed working on the monkey board without secondary safety harness attached. 100% tie-off was not maintained and wind speed exceeded 25 knots.',
  },
  {
    title: 'Moran GGS: Bypassed LOTO on High Pressure Valve',
    site: 'Moran Gas Gathering Station (GGS #3)',
    category: 'UNSAFE_CONDITION' as const,
    narrative:
      'Maintenance crew bypassed lockout/tagout mechanical interlock on 3,000 psi test line without isolation permit. Line was not depressurized before flange bolt removal.',
  },
  {
    title: 'Naharkatiya Well: H2S Spike without SCBA',
    site: 'Naharkatiya Well #114 (Workover Unit #2)',
    category: 'NEAR_MISS' as const,
    narrative:
      'H2S alarm reached 15 ppm during mud circulation. Crew working near shale shakers without personal gas monitors and without emergency escape breathing apparatus (EEBA) staged nearby.',
  },
  {
    title: 'Digboi CTF: Routine Inspection (Compliant / Low Risk)',
    site: 'Digboi Central Tank Farm (Crude CTF)',
    category: 'UNSAFE_CONDITION' as const,
    narrative:
      'Daily housekeeping and fire barrier inspection performed on crude manifold. All valves properly locked and no hazardous leaks or combustible gases detected.',
  },
];
