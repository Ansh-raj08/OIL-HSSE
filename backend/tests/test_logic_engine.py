# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# Logic Engine Calibration & Audit Test Suite (Python Backend)
# Tests: IOGP 9 Life-Saving Rules, Confined Space, Line of Fire,
#        Negation Preservation, SIF Thresholds & Tier Gradation
# ============================================================

import pytest
from app.logic_engine import (
    analyze_narrative,
    classify_lsr,
    assess_risk,
    derive_risk_level,
    detect_negations,
    generate_recommendations,
)

# ── 1. IOGP Life-Saving Rules Complete Coverage ───────────────
def test_lsr_01_energy_isolation():
    narrative = "Technician started maintenance on manifold without verifying LOTO depressurization to 0 psi."
    result = classify_lsr(narrative)
    assert result["code"] == "LSR-01"
    assert result["matchType"] == "RULE_MATCHED"

def test_lsr_02_confined_space_entry():
    narrative = "Contractor entered crude oil storage tank for internal inspection without confined space entry permit or hole watch attendant."
    result = classify_lsr(narrative)
    assert result["code"] == "LSR-02"
    assert result["matchType"] == "RULE_MATCHED"
    assert "Confined Space" in result["title"]

def test_lsr_02_confined_space_variants():
    narrative = "Roustabout descended into mud pit sump without atmospheric testing for oxygen deficiency."
    result = classify_lsr(narrative)
    assert result["code"] == "LSR-02"

def test_lsr_03_working_at_height():
    narrative = "Driller observed on monkey board at 12 meters height without 100% tie-off harness."
    result = classify_lsr(narrative)
    assert result["code"] == "LSR-03"
    assert result["matchType"] == "RULE_MATCHED"

def test_lsr_04_hot_work():
    narrative = "Grinding and torch cutting initiated near crude separator with combustible hydrocarbon vapor present."
    result = classify_lsr(narrative)
    assert result["code"] == "LSR-04"
    assert result["matchType"] == "RULE_MATCHED"

def test_lsr_05_driving():
    narrative = "Crude water bowser truck observed speeding at 75 km/h on access road, driver not wearing seatbelt."
    result = classify_lsr(narrative)
    assert result["code"] == "LSR-05"
    assert result["matchType"] == "RULE_MATCHED"

def test_lsr_06_line_of_fire():
    narrative = "Floorman positioned in line of fire while make-up tongs were swinging under tension. No whip check on pressurized hose."
    result = classify_lsr(narrative)
    assert result["code"] == "LSR-06"
    assert result["matchType"] == "RULE_MATCHED"
    assert "Line of Fire" in result["title"]

def test_lsr_06_line_of_fire_variants():
    narrative = "Worker entered barricaded drop zone under derrick while heavy wrench slipped from monkey board."
    result = classify_lsr(narrative)
    assert result["code"] == "LSR-06"

def test_lsr_07_toxic_gas():
    narrative = "Personal H2S monitor alarmed at 15 ppm near wellhead, employee evacuated without EEBA breathing apparatus."
    result = classify_lsr(narrative)
    assert result["code"] == "LSR-07"
    assert result["matchType"] == "RULE_MATCHED"

def test_lsr_08_bypassing_controls():
    narrative = "Instrument tech bypassed high-pressure safety interlock on separator to prevent production trip without MOC."
    result = classify_lsr(narrative)
    assert result["code"] == "LSR-08"
    assert result["matchType"] == "RULE_MATCHED"

def test_lsr_09_lifting():
    narrative = "Mobile crane lifting heavy 9-5/8 casing bundle without tag lines, load swinging towards personnel."
    result = classify_lsr(narrative)
    assert result["code"] == "LSR-09"
    assert result["matchType"] == "RULE_MATCHED"

# ── 2. Negation Detection & Preservation Calibration ───────────
def test_detect_multiple_negations():
    narrative = "Roughneck worked at height without safety harness and tie-off was not maintained. Missing secondary lanyard."
    negations = detect_negations(narrative)
    assert len(negations) >= 2
    phrases = [n["phrase"].lower() for n in negations]
    assert any("without safety harness" in p for p in phrases)
    assert any("not maintained" in p for p in phrases)

def test_compliant_positive_phrasing():
    positive_narrative = "Worker inspected monkey board with full safety harness and lanyard securely attached."
    negations = detect_negations(positive_narrative)
    assert len(negations) == 0

def test_upstream_negation_tokens():
    narrative = "Crew proceeded with unauthorized vessel entry, missing gas detector, and bypassed ESD trip."
    negations = detect_negations(narrative)
    assert len(negations) >= 2

# ── 3. Deterministic Risk Scoring & SIF Precursor Calibration ──
def test_high_energy_sif_precursor():
    narrative = "Roustabout observed working at 8 meters height on monkey board without safety harness attached. Tie-off was not maintained."
    risk = assess_risk(narrative)
    assert risk["isSifPrecursor"] is True
    assert risk["level"] == "CRITICAL"
    assert risk["score"] >= 80

def test_extreme_multi_hazard():
    narrative = "High pressure gas kick at 1200 psi encountered. ESD valve bypassed by operator, well not shut in, and H2S leak alarm active without breathing apparatus."
    risk = assess_risk(narrative)
    assert risk["level"] == "CRITICAL"
    assert risk["score"] >= 90

def test_moderate_violation_high_tier():
    narrative = "Truck driver operated light utility pickup truck without seatbelt fastened during routine daytime transit on lease road."
    risk = assess_risk(narrative)
    assert 60 <= risk["score"] < 80
    assert risk["level"] == "HIGH"

def test_substandard_condition_medium_tier():
    narrative = "Minor oil seepage observed around secondary flange valve packing. No active pressure release."
    risk = assess_risk(narrative)
    assert 30 <= risk["score"] < 60
    assert risk["level"] == "MEDIUM"

def test_routine_compliant_low_tier():
    narrative = "Routine housekeeping shift handover completed. Rig floor clear of mud and tools stored in designated racks."
    risk = assess_risk(narrative)
    assert risk["score"] < 30
    assert risk["level"] == "LOW"
    assert risk["isSifPrecursor"] is False

# ── 4. Hierarchy-of-Controls Recommendations Calibration ──────
def test_sif_elimination_stop_work():
    actions = generate_recommendations("LSR-02", "LSR-02: Confined Space Entry", True, "Moran GGS #3")
    assert len(actions) >= 3
    assert actions[0]["level"] == "ELIMINATION"
    assert "Stop-Work Order" in actions[0]["action"]
    assert actions[0]["urgency"] == "IMMEDIATE"

def test_confined_space_recommendations():
    actions = generate_recommendations("LSR-02", "LSR-02: Confined Space Entry", True, "Digboi CTF")
    action_texts = " ".join([a["action"].lower() for a in actions])
    assert "ventilation" in action_texts or "gas test" in action_texts or "o₂" in action_texts

def test_line_of_fire_recommendations():
    actions = generate_recommendations("LSR-06", "LSR-06: Line of Fire & Dropped Objects", True, "Duliajan Rig #7")
    action_texts = " ".join([a["action"].lower() for a in actions])
    assert "exclusion zone" in action_texts or "retention" in action_texts or "barricade" in action_texts

# ── 5. End-to-End Unified Pipeline Integration ─────────────────
def test_unified_pipeline_confined_space():
    narrative = "Worker entered slug catcher vessel without gas test certification or continuous forced-air ventilation. Sump unventilated."
    analysis = analyze_narrative(narrative, "Dikom CTF")
    assert analysis["lsr"]["code"] == "LSR-02"
    assert analysis["isSifPrecursor"] is True
    assert len(analysis["xaiTriggers"]) > 0
    assert len(analysis["lsrViolations"]) > 0
    assert analysis["lsrViolations"][0]["code"] == "LSR-02"
    assert len(analysis["hierarchyActions"]) >= 3

def test_unified_pipeline_line_of_fire():
    narrative = "Heavy drill collar swung in line of fire across rotary table without tag line control. Rig floor exclusion zone breached."
    analysis = analyze_narrative(narrative, "Borbil Wellsite #04")
    assert analysis["lsr"]["code"] == "LSR-06"
    assert analysis["risk"]["score"] >= 65
    assert analysis["isSifPrecursor"] is True
    assert any(t["isNegation"] or t["weight"] >= 0.8 for t in analysis["xaiTriggers"])
