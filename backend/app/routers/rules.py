# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# Statutory Guidelines & Logic Engine Rules Router (FastAPI)
# Single Source of Truth for IOGP 459, Hierarchy of Controls,
# and Negation-Aware Detection Rules (SIH26165 v2.3.1)
# ============================================================

from typing import List, Dict, Any
from fastapi import APIRouter
from app.logic_engine.lsr_mapper import LSR_KEYWORD_GROUPS
from app.logic_engine.recommendation_generator import LSR_RECOMMENDATIONS
from app.logic_engine.negation_detector import NEGATION_PATTERNS

router = APIRouter(prefix="/rules", tags=["Rules & Statutory Guidelines"])

# Plain-language descriptions and statutory mandates for each IOGP Life-Saving Rule
LSR_METADATA: Dict[str, Dict[str, Any]] = {
    "LSR-01": {
        "title": "Energy Isolation / Lock-Out Tag-Out (LOTO)",
        "iogpIcon": "power-off",
        "description": "Verify zero-energy state and positive physical mechanical isolation before commencing maintenance or intervention on pressurized, electrical, or hydrocarbon systems.",
        "statutoryReference": "OISD-GDN-145 • DGMS Tech Circular (Elec) 02/2019",
        "keyTriggers": ["Lockout / Tagout (LOTO)", "Double Block & Bleed (DBB)", "Zero Energy Verification", "ESD Valve Isolation", "Depressurization Blind"],
    },
    "LSR-02": {
        "title": "Confined Space Entry",
        "iogpIcon": "box",
        "description": "Obtain authorized permit-to-work, continuously test atmosphere (O₂ ≥ 19.5%, H₂S < 5 ppm, LEL < 1%), verify mechanical ventilation, and post a dedicated hole watch standby attendant.",
        "statutoryReference": "DGMS Circular (Legislation) 04/2017 • OISD-STD-105",
        "keyTriggers": ["Manway / Vessel Entry", "Atmospheric 4-Gas Testing", "Continuous Ventilation", "Standby Attendant / Hole Watch", "Mud Pit / Cellar Entry"],
    },
    "LSR-03": {
        "title": "Working at Height",
        "iogpIcon": "arrow-up-circle",
        "description": "Protect against falls from elevation (≥ 1.8m) using certified 100% dual-tie-off harnesses, inspected anchorages, engineered scaffolding, and secure monkey board tethering.",
        "statutoryReference": "OISD-STD-115 • DGMS OMR-2017 Reg 72",
        "keyTriggers": ["100% Tie-Off Maintained", "Certified Anchor Point", "Derrick Monkey Board", "Full-Body Safety Harness", "Edge Protection / Handrails"],
    },
    "LSR-04": {
        "title": "Hot Work & Explosive Atmospheres",
        "iogpIcon": "flame",
        "description": "Identify and control flammable vapor and gas hazards before striking sparks, welding, or cutting. Perform mandatory atmospheric sweeps (< 1% LEL) within 30 minutes of strike.",
        "statutoryReference": "OISD-STD-105 • OMR-2017 Reg 88",
        "keyTriggers": ["Hot Work Permit Issued", "LEL Atmosphere Sweep (< 1%)", "Fire Watch Standby Posted", "Spark Containment Habitats", "Combustible Storage Cleared"],
    },
    "LSR-05": {
        "title": "Safe Driving & Journey Management",
        "iogpIcon": "truck",
        "description": "Enforce mandatory three-point seatbelt usage, strict GPS speed limits, pre-trip vehicle roadworthiness checks, and authorized journey management plans for all crude and equipment convoys.",
        "statutoryReference": "Central Motor Vehicles Rules • OIL Fleet SOP 2024",
        "keyTriggers": ["Three-Point Seatbelts Fastened", "In-Cab Journey Management GPS", "Speed Compliance (< 40 km/h Field)", "No Mobile Phone Usage", "Fatigue Rest Protocol"],
    },
    "LSR-06": {
        "title": "Line of Fire & Dropped Object Prevention",
        "iogpIcon": "alert-triangle",
        "description": "Position yourself outside rotating machinery swing paths, whip-check all high-pressure discharge hoses, erect barricaded exclusion zones beneath derrick hoists, and secure elevated tools.",
        "statutoryReference": "DROPS International Guidelines • DGMS Circular 08/2021",
        "keyTriggers": ["Barricaded Exclusion Zone", "High-Pressure Hose Whip-Checks", "Secondary Retention on Rig Tools", "Tongs Swing Clear Path", "Rotary Table Clearance"],
    },
    "LSR-07": {
        "title": "Toxic Gas & H₂S Exposure Defense",
        "iogpIcon": "wind",
        "description": "Wear calibrated personal multi-gas monitors in sour production zones, stage Emergency Escape Breathing Apparatus (EEBA) at muster points, and immediately evacuate upwind to designated windsock areas upon alarm.",
        "statutoryReference": "OISD-STD-116 • DGMS Sour Gas Mandatory Code",
        "keyTriggers": ["Personal 4-Gas Monitor Bump-Tested", "Emergency Escape Breathing Apparatus (EEBA)", "Fixed Head Gas Detection", "Upwind Muster Point / Windsock", "H₂S Sour Gas Contingency Plan"],
    },
    "LSR-08": {
        "title": "Bypassing Safety Critical Controls",
        "iogpIcon": "shield-alert",
        "description": "Obtain senior managerial authorization before defeating, inhibiting, or overriding any safety-critical element (SCE), emergency shutdown valve (ESD), pressure safety valve (PSV), or interlock.",
        "statutoryReference": "OISD-STD-112 (Asset Integrity) • DGMS OMR-2017",
        "keyTriggers": ["Management of Change (MOC) Authorization", "Safety Critical Element (SCE) Register", "Override Log Maintained", "Temporary Bypass Protocol", "Compensating Risk Controls"],
    },
    "LSR-09": {
        "title": "Mechanical Lifting Operations",
        "iogpIcon": "anchor",
        "description": "Never walk under suspended loads. Verify certified rigging, competent licensed crane operators, valid third-party load test certificates, tag-line guidance, and pre-lift exclusion zones.",
        "statutoryReference": "DGMS Circular 06/2018 • OISD-RP-110",
        "keyTriggers": ["Rigging Third-Party Certification", "Never Walk Under Suspended Load", "Tag Lines for Load Guidance", "Clear Exclusion Barricades", "Lift Plan Approved for Heavy Lift"],
    },
}

HIERARCHY_OF_CONTROLS_TIERS = [
    {
        "tier": 1,
        "name": "Elimination / Substitution",
        "effectiveness": "Most Effective (100% Risk Removal)",
        "color": "emerald",
        "description": "Physically remove the hazard or substitute hazardous equipment/chemicals with inherently safer alternatives. In upstream drilling, this includes cold-cutting instead of open-flame torch work or automated pipe racking to remove humans from the derrick floor.",
        "oilImplementation": "Automated iron roughneck deployment; non-toxic biodegradable drilling fluid substitution.",
    },
    {
        "tier": 2,
        "name": "Engineering Controls",
        "effectiveness": "High Effectiveness (Isolates Workers from Hazard)",
        "color": "blue",
        "description": "Implement engineered physical barriers that do not rely on human compliance. Examples include key-trapped mechanical interlocks on ESD valves, permanent forced-air positive pressure ventilation, and self-retracting lifelines (SRL).",
        "oilImplementation": "Key-trapped valve interlocks, fixed optical flame/gas detection, whip-checks on all 5,000 psi hoses.",
    },
    {
        "tier": 3,
        "name": "Administrative Controls",
        "effectiveness": "Moderate Effectiveness (Alters Work Behavior)",
        "color": "amber",
        "description": "Regulate and direct safe operating behavior through statutory compliance procedures, Permit-to-Work (PTW) audits, mandatory safety stand-downs, continuous atmospheric logging, and barrier isolation registers.",
        "oilImplementation": "DGMS Permit-to-Work verification, 4-gas atmosphere sweep logs, LOTO double-isolation signoffs.",
    },
    {
        "tier": 4,
        "name": "Personal Protective Equipment (PPE)",
        "effectiveness": "Last Line of Defense (Reduces Injury Severity)",
        "color": "rose",
        "description": "Protect the individual worker when higher-tier barriers cannot eliminate the risk. Always deployed in tandem with higher controls, never as a sole barrier for high-consequence SIF hazards.",
        "oilImplementation": "Full-body fall arrest harness with dual shock-absorbing lanyards, 30-min SCBA rescue cylinders, EEBA hoods.",
    },
]

NEGATION_DETECTION_OVERVIEW = {
    "title": "Contextual Negation-Aware Detection Architecture",
    "plainLanguageSummary": (
        "In upstream HSSE incident reporting, conventional keyword-matching and naive NLP models frequently fail on "
        "barrier-failure statements like 'worker at height without safety harness' or 'flange dismantled without LOTO'. "
        "Traditional text search identifies 'safety harness' or 'LOTO' and mistakenly infers that protective measures were "
        "in place. The OIL HSSE Logic Engine incorporates a deterministic contextual negation pipeline that explicitly detects "
        "critical barrier omission markers while filtering out benign absence-of-consequence phrases (such as 'no injury occurred'). "
        "This ensures that life-threatening safety breaches are elevated to high-priority SIF precursors rather than slipping through undetected."
    ),
    "activeNegationTokens": [keyword for keyword, _ in NEGATION_PATTERNS],
    "benignFilterTokens": ["no injury", "no damage", "no release", "no harm", "no fire", "zero active leak"],
    "designPrinciple": (
        "Deterministic explainability over black-box heuristics: Every flagged precursor links directly to the specific "
        "extracted phrase in the narrative, enabling immediate auditability by Chief HSSE Superintendents."
    ),
}

@router.get("", summary="Get statutory guidelines, IOGP LSR definitions, and logic engine rules")
async def get_statutory_rules():
    """
    Returns the comprehensive, single-source-of-truth guidelines and decision rules
    implemented by the OIL HSSE SIF-precursor logic engine.
    """
    rules_list = []
    for group in LSR_KEYWORD_GROUPS:
        code = group["code"]
        meta = LSR_METADATA.get(code, {})
        recs = LSR_RECOMMENDATIONS.get(code, [])
        
        rules_list.append({
            "code": code,
            "title": meta.get("title", group["title"]),
            "category": group["category"],
            "baseRiskScore": group["base_score"],
            "description": meta.get("description", "Mandatory oilfield safety rule."),
            "statutoryReference": meta.get("statutoryReference", "IOGP Report 459"),
            "keyTriggers": meta.get("keyTriggers", []),
            "hierarchyRemedies": recs,
        })
        
    # Sort rules numerically by code (LSR-01 to LSR-09)
    rules_list.sort(key=lambda r: r["code"])

    return {
        "status": "success",
        "standard": "IOGP Report 459 • OISD-105 • DGMS OMR-2017",
        "version": "2.3.1",
        "lifeSavingRules": rules_list,
        "hierarchyOfControls": HIERARCHY_OF_CONTROLS_TIERS,
        "negationDetection": NEGATION_DETECTION_OVERVIEW,
    }
