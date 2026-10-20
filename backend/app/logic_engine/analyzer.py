# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# Logic Engine: Unified Analysis Pipeline (Python Backend)
# ============================================================

from typing import Dict, List, Any
from app.logic_engine.negation_detector import detect_negations
from app.logic_engine.risk_scorer import assess_risk, derive_risk_level
from app.logic_engine.lsr_mapper import classify_lsr
from app.logic_engine.recommendation_generator import generate_recommendations
from app.logic_engine.escalation_evaluator import evaluate_escalation_likelihood

def build_xai_triggers(
    negation_matches: List[Dict[str, Any]],
    high_energy_modifiers: List[str],
    narrative: str,
) -> List[Dict[str, Any]]:
    triggers: List[Dict[str, Any]] = []
    
    # High-Energy Hazard Indicators
    if high_energy_modifiers:
        for mod in high_energy_modifiers:
            short_token = mod.split("(")[0].strip()
            triggers.append({
                "token": short_token,
                "weight": 0.88,
                "context": f"High-energy precursor vector identified: {mod}",
                "isNegation": False,
            })
            
    # Compromised / Missing Safety Barriers
    if negation_matches:
        for neg in negation_matches:
            triggers.append({
                "token": neg["phrase"],
                "weight": 0.94,
                "context": f'Compromised barrier / negation clause: "{neg["phrase"]}" in narrative',
                "isNegation": True,
            })
            
    if triggers:
        return triggers
        
    # Fallback for compliant/routine observations
    return [
        {
            "token": "routine observation",
            "weight": 0.15,
            "context": "Standard field activity logged without high-energy escalation markers",
            "isNegation": False,
        }
    ]

def build_lsr_violations(lsr: Dict[str, Any]) -> List[Dict[str, Any]]:
    if lsr.get("matchType") == "DEFAULT":
        return []
        
    violations = [
        {
            "code": lsr["code"],
            "label": lsr["title"],
            "description": f'Primary potential violation under {lsr["title"]}.',
        }
    ]
    
    if lsr.get("secondaryMatches"):
        for sec in lsr["secondaryMatches"]:
            violations.append({
                "code": sec["code"],
                "label": sec["title"],
                "description": f'Associated secondary rule: {sec["title"]}.',
            })
            
    return violations

def analyze_narrative(narrative: str, site: str = "Unknown Site") -> Dict[str, Any]:
    risk = assess_risk(narrative)
    lsr = classify_lsr(narrative)
    xai_triggers = build_xai_triggers(risk["negationMatches"], risk["highEnergyModifiers"], narrative)
    lsr_violations = build_lsr_violations(lsr)
    hierarchy_actions = generate_recommendations(
        lsr["code"],
        lsr["title"],
        risk["isSifPrecursor"],
        site,
    )
    escalation_likelihood = evaluate_escalation_likelihood(
        risk_score=risk["score"],
        risk_level=risk["level"],
        high_energy_modifiers=risk["highEnergyModifiers"],
        negation_matches=risk["negationMatches"],
        validation_status="PENDING",
        site=site,
        lsr_code=lsr["code"],
    )
    
    return {
        "risk": risk,
        "lsr": lsr,
        "xaiTriggers": xai_triggers,
        "hierarchyActions": hierarchy_actions,
        "lsrViolations": lsr_violations,
        "isSifPrecursor": risk["isSifPrecursor"],
        "negationMatches": risk["negationMatches"],
        "escalationLikelihood": escalation_likelihood,
    }
