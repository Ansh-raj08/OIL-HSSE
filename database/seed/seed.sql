-- ============================================================
-- OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
-- Seed Data: Profiles, Datasets, Canonical Incidents, & Analysis
-- ============================================================

-- 1. Insert Initial User Profiles
insert into public.profiles (id, email, full_name, role, basin, designation)
values
    ('a0000000-0000-0000-0000-000000000001', 'admin@oilindia.in', 'Administrator', 'ADMIN', 'Assam Operational Basin', 'Chief HSSE Superintendent'),
    ('a0000000-0000-0000-0000-000000000002', 'user@oilindia.in', 'Standard User', 'USER', 'Assam Operational Basin', 'HSSE Observer')
on conflict (id) do nothing;

-- 2. Insert Sample Dataset
insert into public.datasets (
    id,
    filename,
    original_filename,
    storage_path,
    file_size_bytes,
    row_count,
    valid_row_count,
    invalid_row_count,
    warning_row_count,
    status,
    uploaded_by
) values (
    'd0000000-0000-0000-0000-000000000001',
    'OIL_Assam_Drilling_Q1_2026.csv',
    'OIL_Assam_Drilling_Q1_2026_Raw.csv',
    'datasets/2026/01/OIL_Assam_Drilling_Q1_2026.csv',
    184320,
    12,
    12,
    0,
    0,
    'READY',
    'a0000000-0000-0000-0000-000000000001'
) on conflict (id) do nothing;

-- 3. Insert Canonical Incidents
insert into public.incidents (
    id, dataset_id, site, basin, reported_by, category, timestamp,
    raw_narrative, cleaned_narrative, truncated_narrative, validation_status
) values
(
    'OIL-2026-1042',
    'd0000000-0000-0000-0000-000000000001',
    'Duliajan Rig #7 (Brahmaputra Basin)',
    'Assam Operational Basin',
    'M. Kalita (Drilling Supervisor)',
    'UNSAFE_ACT',
    '14 Jan 2026, 06:45 IST',
    'Roughneck observed on monkey board at 28 meters elevation without secondary safety harness attached while racking 5-inch drill pipe stands during trip out. Wind gusts exceeded 35 knots with intermittent rain showers.',
    'Roughneck observed on monkey board at 28 meters elevation without secondary safety harness attached while racking 5-inch drill pipe stands during trip out. Wind gusts exceeded 35 knots with intermittent rain showers.',
    'Roughneck observed on monkey board at 28m elevation without secondary safety harness attached during trip out...',
    'PENDING'
),
(
    'OIL-2026-1041',
    'd0000000-0000-0000-0000-000000000001',
    'Moran Gas Gathering Station #3',
    'Assam Operational Basin',
    'R. Borah (Process Engineer)',
    'UNSAFE_CONDITION',
    '14 Jan 2026, 04:15 IST',
    'Contractor maintenance team bypassed safety interlock on separator high-pressure relief valve V-204 without PTW authorization and not depressurized before flange unbolting commenced on condensate line.',
    'Contractor maintenance team bypassed safety interlock on separator high-pressure relief valve V-204 without PTW authorization and not depressurized before flange unbolting commenced on condensate line.',
    'Contractor bypassed safety interlock on HP separator valve without PTW authorization and not depressurized...',
    'PENDING'
),
(
    'OIL-2026-1040',
    'd0000000-0000-0000-0000-000000000001',
    'Naharkatiya Well #114 (Workover)',
    'Assam Operational Basin',
    'B. Saikia (Workover In-Charge)',
    'NEAR_MISS',
    '13 Jan 2026, 22:30 IST',
    'During swabbing operation, unexpected pocket of sour gas released at wellhead. Portable H2S sensor alarmed at 24 ppm. Two roustabouts working without personal gas monitors within 5-meter red zone evacuated without EEBA available on escape route.',
    'During swabbing operation, unexpected pocket of sour gas released at wellhead. Portable H2S sensor alarmed at 24 ppm. Two roustabouts working without personal gas monitors within 5-meter red zone evacuated without EEBA available on escape route.',
    'Sour gas release (24 ppm H2S) during swabbing. Workers within 5m zone without personal gas monitors...',
    'PENDING'
)
on conflict (id) do nothing;

-- 4. Insert Corresponding Incident Analysis Records
insert into public.incident_analysis (
    incident_id, risk_score, risk_level, is_sif_precursor,
    lsr_code, lsr_title, lsr_category,
    lsr_violations, xai_triggers, hierarchy_actions, analysis_version
) values
(
    'OIL-2026-1042',
    94,
    'CRITICAL',
    true,
    'LSR-03',
    'Working at Height',
    'Fall Protection',
    '["100% tie-off mandatory above 1.8m violated at 28m derrick monkey board elevation", "Adverse environmental condition rule breached: work at height during >30 knot wind gusts"]'::jsonb,
    '[{"token": "without secondary safety harness attached", "weight": 42, "context": "monkey board at 28 meters elevation without secondary safety harness attached while racking", "isNegation": true}, {"token": "monkey board at 28 meters", "weight": 28, "context": "Roughneck observed on monkey board at 28 meters elevation", "isNegation": false}, {"token": "wind gusts exceeded 35 knots", "weight": 18, "context": "Wind gusts exceeded 35 knots with intermittent rain showers", "isNegation": false}]'::jsonb,
    '[{"level": "ELIMINATION", "action": "Issue immediate STOP WORK ORDER on Duliajan Rig #7 derrick operations.", "priority": 1}, {"level": "ENGINEERING", "action": "Inspect and re-certify inertia-reel fall arresters and monkey board anchor tracks.", "priority": 2}, {"level": "ADMINISTRATIVE", "action": "Conduct mandatory stand-down safety briefing with Tour-A drilling crew on 100% tie-off compliance.", "priority": 3}, {"level": "PPE", "action": "Inspect full-body harnesses, twin lanyards, and shock absorbers before resuming tripping.", "priority": 4}]'::jsonb,
    'v2.0-deterministic'
),
(
    'OIL-2026-1041',
    91,
    'CRITICAL',
    true,
    'LSR-01',
    'Energy Isolation / LOTO',
    'Process Safety',
    '["Mechanical & pressure isolation verification omitted prior to breaking line containment", "Safety-critical bypass executed without formal Management of Change (MOC) and PTW approval"]'::jsonb,
    '[{"token": "bypassed safety interlock", "weight": 38, "context": "Contractor maintenance team bypassed safety interlock on separator", "isNegation": true}, {"token": "without PTW authorization", "weight": 32, "context": "relief valve V-204 without PTW authorization and not depressurized", "isNegation": true}, {"token": "not depressurized", "weight": 22, "context": "without PTW authorization and not depressurized before flange unbolting", "isNegation": true}]'::jsonb,
    '[{"level": "ELIMINATION", "action": "Halt all maintenance work on Separator V-204 and reinstate safety interlock immediately.", "priority": 1}, {"level": "SUBSTITUTION", "action": "Depressurize and vent separator manifold through flare header before any physical work.", "priority": 2}, {"level": "ADMINISTRATIVE", "action": "Revoke contractor work permit; institute formal inquiry into permit-to-work isolation breach.", "priority": 3}, {"level": "ENGINEERING", "action": "Apply physical lock-out/tag-out (LOTO) padlocks and bleed valve tags with double block and bleed.", "priority": 4}]'::jsonb,
    'v2.0-deterministic'
),
(
    'OIL-2026-1040',
    88,
    'CRITICAL',
    true,
    'LSR-07',
    'Hazardous / Toxic Gas Exposure',
    'Occupational Health & Hygiene',
    '["Entry into active sour wellhead zone without calibrated multi-gas personal monitor", "Escape route safety compromised: Emergency Escape Breathing Apparatus (EEBA) not staged within 15m radius"]'::jsonb,
    '[{"token": "without personal gas monitors", "weight": 36, "context": "Two roustabouts working without personal gas monitors within 5-meter red zone", "isNegation": true}, {"token": "without EEBA available", "weight": 34, "context": "5-meter red zone evacuated without EEBA available on escape route", "isNegation": true}, {"token": "H2S sensor alarmed at 24 ppm", "weight": 24, "context": "Portable H2S sensor alarmed at 24 ppm", "isNegation": false}]'::jsonb,
    '[{"level": "ELIMINATION", "action": "Shut in Well #114 and clear all non-essential personnel to primary upwind muster point.", "priority": 1}, {"level": "ENGINEERING", "action": "Rig up forced air explosion-proof ventilation blowers at wellhead cellar.", "priority": 2}, {"level": "PPE", "action": "Mandate positive-pressure SCBA for any re-entry into wellhead perimeter until H2S < 10 ppm.", "priority": 3}, {"level": "ADMINISTRATIVE", "action": "Verify calibration records of all fixed and portable H2S telemetry sensors at Naharkatiya site.", "priority": 4}]'::jsonb,
    'v2.0-deterministic'
)
on conflict (incident_id) do nothing;

-- 5. Seed Initial Audit Log
insert into public.audit_logs (
    entity_type, entity_id, action, actor_id, actor_name, details
) values (
    'dataset',
    'd0000000-0000-0000-0000-000000000001',
    'UPLOAD',
    'a0000000-0000-0000-0000-000000000001',
    'T. Baruah',
    '{"filename": "OIL_Assam_Drilling_Q1_2026.csv", "rows": 12, "source": "System Initializer"}'::jsonb
);
