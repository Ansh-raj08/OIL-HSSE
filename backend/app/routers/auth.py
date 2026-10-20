# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# Authentication Router (FastAPI)
# ============================================================

from fastapi import APIRouter
from app.models.schemas import LoginRequest, LoginResponse, AuthSession

router = APIRouter(prefix="/auth", tags=["Auth"])

ROLE_PROFILES = {
    "ADMIN": {
        "userId": "a0000000-0000-0000-0000-000000000001",
        "name": "Administrator",
        "designation": "Chief HSSE Superintendent",
        "email": "admin@oilindia.in",
        "canConfirmEscalate": True,
        "canOverride": True,
        "canManageDatasets": True,
    },
    "USER": {
        "userId": "a0000000-0000-0000-0000-000000000002",
        "name": "Standard User",
        "designation": "HSSE Observer",
        "email": "user@oilindia.in",
        "canConfirmEscalate": False,
        "canOverride": False,
        "canManageDatasets": False,
    },
}

@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    # Only ever issue ADMIN or USER
    role = "ADMIN" if req.role == "ADMIN" else "USER"
    profile = ROLE_PROFILES[role]
    name = req.name or profile["name"]
    
    session = AuthSession(
        userId=profile["userId"],
        name=name,
        role=role,
        designation=profile["designation"],
        basin="Assam Operational Basin",
        email=profile["email"],
        canConfirmEscalate=profile["canConfirmEscalate"],
        canOverride=profile["canOverride"],
        canManageDatasets=profile["canManageDatasets"],
    )
    return LoginResponse(session=session)
