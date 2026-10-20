# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# Logic Engine: Deterministic Risk Scorer (Python Backend)
# ============================================================

import re
from typing import List, Dict, Any
from app.logic_engine.negation_detector import detect_negations
from app.logic_engine.lsr_mapper import get_lsr_base_score

NEGATION_WEIGHT = 16
SCORE_FLOOR = 8
SCORE_CEILING = 98
BASELINE_SCORE = 15
SIF_THRESHOLD = 65

HIGH_ENERGY_PATTERNS = [
    {
        "name": "High Pressure Energy (>500 psi / Kick / Blowout / Uncontrolled Release)",
        "regex": re.compile(r"(high\s+pressure|\b([5-9]\d{2}|\d{4,})\s*psi\b|well\s+kick|blowout|uncontrolled\s+(flow|release|leak)|pressure\s+surge)", re.IGNORECASE),
        "weight": 14,
    },
    {
        "name": "Elevation Fall Potential (>4m / Monkey Board / Derrick / Mast)",
        "regex": re.compile(r"(\b([4-9]|\d{2,})\s*meter(s)?\b|monkey\s+board|derrick|mast\s+top|crown\s+block|offshore\s+rig\s+edge)", re.IGNORECASE),
        "weight": 12,
    },
    {
        "name": "Lethal Toxic Gas Energy (H2S >10 ppm / Release in Breathing Zone)",
        "regex": re.compile(r"(h2s\s+(release|leak|alarm|cloud)|\b(1[0-9]|[2-9]\d|\d{3,})\s*ppm\s+h2s|sour\s+gas\s+leak|lethal\s+toxic)", re.IGNORECASE),
        "weight": 15,
    },
    {
        "name": "Heavy Suspended Mass / Drop Zone Vector (BOP / Tubulars / Crane Over Personnel)",
        "regex": re.compile(r"(suspended\s+(load|pipe|casing|bop|tubular|drill\s+string)\s+(over|above)|under\s+suspended|drop\s+zone\s+breach)", re.IGNORECASE),
        "weight": 12,
    },
    {
        "name": "Explosive Atmosphere / Ignition Energy in Hydrocarbon Hazard Zone",
        "regex": re.compile(r"(explosive\s+atmospher|\b([1-9]\d|\d{3,})%\s*lel|spark\s+near\s+(tank|wellhead|manifold|separator)|gas\s+leak\s+igni)", re.IGNORECASE),
        "weight": 14,
    },
    {
        "name": "Confined Space Oxygen Deficiency / Entrapment Vector",
        "regex": re.compile(r"(oxygen\s+deficien|unventilated|o2\s+<\s*19|below\s+19\.5%|toxic\s+atmosphere\s+in\s+(vessel|tank|sump))", re.IGNORECASE),
        "weight": 14,
    },
    {
        "name": "Dynamic Kinetic Vector / High Tension Whipping Hazard",
        "regex": re.compile(r"(whipping\s+hose|parted\s+wireline|snubbing\s+force|cathead\s+entangle|tongs\s+swing|drill\s+string\s+spin)", re.IGNORECASE),
        "weight": 12,
    },
]

ROUTINE_PATTERN = re.compile(
    r"routine|housekeeping|toolbox\s+talk|shift\s+handover|ppe\s+worn|normal\s+ops|satisfactory",
    re.IGNORECASE,
)

def derive_risk_level(score: int) -> str:
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 30:
        return "MEDIUM"
    return "LOW"

def detect_high_energy_modifiers(narrative: str) -> Dict[str, Any]:
    names: List[str] = []
    score = 0
    for item in HIGH_ENERGY_PATTERNS:
        if item["regex"].search(narrative):
            names.append(item["name"])
            score += item["weight"]
    return {
        "names": names,
        "score": min(score, 24),
    }

def assess_risk(narrative: str) -> Dict[str, Any]:
    negation_matches = detect_negations(narrative)
    hazard_score = get_lsr_base_score(narrative)
    high_energy = detect_high_energy_modifiers(narrative)
    negation_score = len(negation_matches) * NEGATION_WEIGHT
    
    is_routine_compliant = (
        len(negation_matches) == 0
        and high_energy["score"] == 0
        and bool(ROUTINE_PATTERN.search(narrative))
    )
    
    if is_routine_compliant:
        raw_score = min(hazard_score, 22)
    else:
        raw_score = BASELINE_SCORE + hazard_score + negation_score + high_energy["score"]
        
    score = min(max(raw_score, SCORE_FLOOR), SCORE_CEILING)
    level = derive_risk_level(score)
    is_sif_precursor = score >= SIF_THRESHOLD
    
    return {
        "score": score,
        "level": level,
        "isSifPrecursor": is_sif_precursor,
        "negationMatches": negation_matches,
        "highEnergyModifiers": high_energy["names"],
        "hazardScore": hazard_score,
        "negationScore": negation_score,
        "highEnergyScore": high_energy["score"],
    }
