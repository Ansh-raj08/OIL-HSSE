# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# FastAPI Routers Package
# ============================================================

from app.routers.incidents import router as incidents_router
from app.routers.datasets import router as datasets_router
from app.routers.analytics import router as analytics_router
from app.routers.auth import router as auth_router
from app.routers.rules import router as rules_router

__all__ = [
    "incidents_router",
    "datasets_router",
    "analytics_router",
    "auth_router",
    "rules_router",
]

