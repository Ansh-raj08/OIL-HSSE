# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# Logic Engine Package
# ============================================================

from app.logic_engine.analyzer import analyze_narrative
from app.logic_engine.risk_scorer import assess_risk, derive_risk_level
from app.logic_engine.lsr_mapper import classify_lsr, get_lsr_base_score
from app.logic_engine.negation_detector import detect_negations
from app.logic_engine.recommendation_generator import generate_recommendations

__all__ = [
    "analyze_narrative",
    "assess_risk",
    "derive_risk_level",
    "classify_lsr",
    "get_lsr_base_score",
    "detect_negations",
    "generate_recommendations",
]
