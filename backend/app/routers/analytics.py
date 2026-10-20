# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# Analytics Router (FastAPI)
# Strict Server-Side Authentication (SIH26165)
# ============================================================

from fastapi import APIRouter, Depends
from app.models.schemas import KPISummary, AnalyticsResponse
from app.services.supabase_service import supabase_service
from app.services.auth_service import require_authenticated_user, AuthenticatedUser

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/kpi", response_model=KPISummary)
async def get_kpi_summary(
    current_user: AuthenticatedUser = Depends(require_authenticated_user),
):
    return await supabase_service.get_kpis()


@router.get("/summary", response_model=AnalyticsResponse)
async def get_analytics_summary(
    current_user: AuthenticatedUser = Depends(require_authenticated_user),
):
    return await supabase_service.get_analytics()
