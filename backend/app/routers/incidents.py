# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# Incidents Router (FastAPI)
# Strict Server-Side Authentication & RBAC (SIH26165)
# ============================================================

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from app.models.schemas import (
    SafetyIncident,
    IngestIncidentRequest,
    ConfirmIncidentRequest,
    OverrideIncidentRequest,
    GetIncidentsResponse,
)
from app.services.supabase_service import supabase_service
from app.services.auth_service import (
    require_admin,
    require_authenticated_user,
    AuthenticatedUser,
)

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.get("", response_model=GetIncidentsResponse)
async def get_incidents(
    category: Optional[str] = Query(None, description="Filter by category (UNSAFE_ACT, UNSAFE_CONDITION, NEAR_MISS)"),
    risk_level: Optional[str] = Query(None, alias="riskLevel", description="Filter by risk level"),
    status: Optional[str] = Query(None, description="Filter by validation status"),
    search: Optional[str] = Query(None, description="Search query across narrative and site"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200, alias="pageSize"),
    current_user: AuthenticatedUser = Depends(require_authenticated_user),
):
    offset = (page - 1) * page_size
    incidents, total = await supabase_service.list_incidents(
        category=category,
        risk_level=risk_level,
        status=status,
        search=search,
        limit=page_size,
        offset=offset,
    )
    return GetIncidentsResponse(
        incidents=incidents,
        total=total,
        page=page,
        pageSize=page_size,
    )


@router.get("/{incident_id}", response_model=SafetyIncident)
async def get_incident(
    incident_id: str,
    current_user: AuthenticatedUser = Depends(require_authenticated_user),
):
    incident = await supabase_service.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    return incident


@router.post("", response_model=SafetyIncident, status_code=201)
async def create_incident(
    req: IngestIncidentRequest,
    current_user: AuthenticatedUser = Depends(require_authenticated_user),
):
    try:
        incident = await supabase_service.create_incident(req)
        return incident
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{incident_id}/confirm", response_model=SafetyIncident)
async def confirm_incident(
    incident_id: str,
    req: ConfirmIncidentRequest,
    current_user: AuthenticatedUser = Depends(require_admin),
):
    try:
        incident = await supabase_service.confirm_incident(
            incident_id=incident_id,
            reviewed_by=req.reviewedBy or current_user.full_name,
            notes=req.escalationNotes,
        )
        return incident
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{incident_id}/override", response_model=SafetyIncident)
async def override_incident(
    incident_id: str,
    req: OverrideIncidentRequest,
    current_user: AuthenticatedUser = Depends(require_admin),
):
    try:
        incident = await supabase_service.override_incident(
            incident_id=incident_id,
            reviewed_by=req.reviewedBy or current_user.full_name,
            justification=req.justification,
        )
        return incident
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
