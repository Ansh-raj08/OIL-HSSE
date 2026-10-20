# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# Logic Engine: Escalation Likelihood Evaluator (Python Backend)
# Deterministic Rule-Based Heuristic Indicator (SIH26165)
# NOT a statistical prediction — strictly rule-based factors
# ============================================================

from typing import Dict, List, Any, Optional

def derive_escalation_tier(score: int) -> str:
    if score >= 75:
        return "SEVERE"
    if score >= 50:
        return "HIGH"
    if score >= 30:
        return "MODERATE"
    return "LOW"

def evaluate_escalation_likelihood(
    risk_score: int,
    risk_level: str,
    high_energy_modifiers: List[str],
    negation_matches: List[Dict[str, Any]],
    validation_status: str = "PENDING",
    site: str = "",
    lsr_code: str = "",
    site_repeat_count: int = 0,
) -> Dict[str, Any]:
    """
    Computes a bounded 0-100 heuristic Escalation Likelihood Score
    and qualitative tier (LOW / MODERATE / HIGH / SEVERE) from 5 transparent,
    deterministic factors:
      1. Unmitigated high-energy hazard modifiers count
      2. Site recurrence of the same LSR category
      3. Unreviewed aging status (pending review)
      4. Risk score proximity to the next severity tier threshold
      5. Density of stacked barrier negation clauses
    """
    factors: List[Dict[str, Any]] = []
    total_score = 12  # Baseline operational exposure floor

    # 1. High-Energy Hazard Modifiers
    he_count = len(high_energy_modifiers)
    if he_count > 0:
        he_weight = min(30, he_count * 15)
        total_score += he_weight
        factors.append({
            "factor": "High-Energy Hazard Modifiers",
            "weight": he_weight,
            "description": f"{he_count} unmitigated high-energy vector(s) identified (e.g. pressure, fall, gas, suspended load).",
        })

    # 2. Site Repeat-Hazard Signal
    # High-activity sites or repeat LSR observations in the area
    high_activity_keywords = ["duliajan", "moran", "naharkatiya", "digboi", "kumchai"]
    site_lower = (site or "").lower()
    is_high_activity_site = any(k in site_lower for k in high_activity_keywords)
    
    if site_repeat_count > 0 or is_high_activity_site:
        repeat_weight = 18 if site_repeat_count > 0 else 12
        total_score += repeat_weight
        factors.append({
            "factor": "Site Precursor Recurrence",
            "weight": repeat_weight,
            "description": f"Historical or active recurrence of {lsr_code or 'precursor'} events logged at {site or 'installation'}.",
        })

    # 3. Unreviewed Incident Aging Factor
    if validation_status == "PENDING":
        pending_weight = 16 if risk_score >= 60 else 10
        total_score += pending_weight
        factors.append({
            "factor": "Unreviewed Aging Exposure",
            "weight": pending_weight,
            "description": "Incident remains in PENDING supervisory state without active confirmation or stop-work order.",
        })
    elif validation_status == "CONFIRMED":
        factors.append({
            "factor": "Supervisory Containment Active",
            "weight": -10,
            "description": "Formally confirmed by Chief HSSE Superintendent; field intervention dispatched.",
        })
        total_score = max(5, total_score - 10)

    # 4. Proximity to Next Severity Tier Cutoff
    # Cutoffs: LOW < 30, MEDIUM 30-59, HIGH 60-79, CRITICAL >= 80
    proximity_weight = 0
    proximity_desc = ""
    if 24 <= risk_score < 30:
        proximity_weight = 12
        proximity_desc = f"Risk score ({risk_score}) is within 6 points of MEDIUM tier cutoff (30)."
    elif 52 <= risk_score < 60:
        proximity_weight = 14
        proximity_desc = f"Risk score ({risk_score}) is within 8 points of HIGH tier cutoff (60)."
    elif 72 <= risk_score < 80:
        proximity_weight = 18
        proximity_desc = f"Risk score ({risk_score}) is within 8 points of CRITICAL SIF precursor cutoff (80)."
    elif risk_score >= 80:
        proximity_weight = 10
        proximity_desc = f"Risk score ({risk_score}) exceeds CRITICAL cutoff; operating at maximum hazard regime."

    if proximity_weight > 0:
        total_score += proximity_weight
        factors.append({
            "factor": "Severity Tier Boundary Proximity",
            "weight": proximity_weight,
            "description": proximity_desc,
        })

    # 5. Density of Stacked Barrier Negations
    neg_count = len(negation_matches)
    if neg_count >= 2:
        neg_weight = min(25, neg_count * 10)
        total_score += neg_weight
        factors.append({
            "factor": "Compounding Barrier Negation Clauses",
            "weight": neg_weight,
            "description": f"{neg_count} stacked barrier absence/negation clauses detected, indicating compounded defense-in-depth failure.",
        })
    elif neg_count == 1:
        total_score += 8
        factors.append({
            "factor": "Isolated Barrier Deficit",
            "weight": 8,
            "description": '1 barrier negation clause identified in narrative.',
        })

    bounded_score = min(max(total_score, 8), 96)
    tier = derive_escalation_tier(bounded_score)

    summary = (
        f"{tier} escalation likelihood ({bounded_score}/100) derived from {len(factors)} deterministic operational signals. "
        "Rule-based indicator, not a statistical prediction."
    )

    return {
        "score": bounded_score,
        "tier": tier,
        "factors": factors,
        "summary": summary,
    }
