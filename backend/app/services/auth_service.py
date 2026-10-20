# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# Strict Token Authentication & Server-Side RBAC Service (SIH26165)
# Zero reliance on client-supplied headers or request body roles.
# All authorization is verified against Supabase Auth & public.profiles.
# ============================================================

from typing import Optional
from pydantic import BaseModel
from fastapi import Header, HTTPException, Depends
from app.config import settings
from app.services.supabase_service import supabase_service


class AuthenticatedUser(BaseModel):
    id: str
    email: str
    role: str  # "ADMIN" | "USER"
    full_name: str
    designation: Optional[str] = None
    basin: Optional[str] = "Assam Operational Basin"


async def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> AuthenticatedUser:
    """
    Validates Bearer token cryptographically via Supabase Auth API,
    resolves the user ID, and strictly queries public.profiles using the
    service-role client to determine the user's authoritative role.
    
    Ignores any X-User-Role or client-supplied role parameters.
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Missing Authorization header. Provide 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.strip().split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Invalid Authorization header format. Expected 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1].strip()
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Bearer token cannot be empty.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ── MOCK / ISOLATED IN-MEMORY DEV MODE SUPPORT ─────────────────────
    if settings.USE_IN_MEMORY_DB:
        if token == "MOCK_EXPIRED_TOKEN":
            raise HTTPException(
                status_code=401,
                detail="Unauthorized: Token has expired.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        elif token == "MOCK_ADMIN_TOKEN":
            return AuthenticatedUser(
                id="73b6506b-c128-49e3-be5f-e23c11e86a96",
                email="admin@oilindia.in",
                role="ADMIN",
                full_name="Chief HSSE Superintendent",
                designation="Chief HSSE Superintendent",
                basin="Assam Operational Basin",
            )
        elif token == "MOCK_USER_TOKEN":
            return AuthenticatedUser(
                id="6bf50f45-9749-49c5-81de-b74550e2d743",
                email="user@oilindia.in",
                role="USER",
                full_name="HSSE Field Observer",
                designation="HSSE Observer",
                basin="Assam Operational Basin",
            )
        else:
            raise HTTPException(
                status_code=401,
                detail="Unauthorized: Invalid authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # ── PRODUCTION / SUPABASE VERIFICATION ─────────────────────────────
    if not supabase_service.client:
        raise HTTPException(
            status_code=503,
            detail="Service Unavailable: Supabase client is not connected.",
        )

    try:
        user_response = supabase_service.client.auth.get_user(token)
        if not user_response or not user_response.user:
            raise ValueError("Token verification returned empty user payload.")
        user = user_response.user
    except Exception as e:
        # Invalid, expired, forged, or malformed JWT token
        raise HTTPException(
            status_code=401,
            detail=f"Unauthorized: Invalid or expired token ({str(e)}).",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch authoritative role from public.profiles table using service role client
    try:
        profile_res = (
            supabase_service.client.from_("profiles")
            .select("*")
            .eq("id", user.id)
            .maybe_single()
            .execute()
        )
        profile = profile_res.data if profile_res else None
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to query user profile: {str(e)}",
        )

    if not profile:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Authenticated user has no profile registered in public.profiles.",
        )

    authoritative_role = profile.get("role", "USER").upper()
    if authoritative_role not in ("ADMIN", "USER"):
        authoritative_role = "USER"

    return AuthenticatedUser(
        id=user.id,
        email=user.email or profile.get("email", ""),
        role=authoritative_role,
        full_name=profile.get("full_name") or user.user_metadata.get("full_name") or "OIL HSSE Officer",
        designation=profile.get("designation"),
        basin=profile.get("basin") or "Assam Operational Basin",
    )


async def require_authenticated_user(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    """Enforces that the request has a valid Supabase authenticated session."""
    return current_user


async def require_admin(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    """
    Enforces that the caller has a valid session AND the database role is strictly ADMIN.
    Rejects any standard USER, non-admin session, or forged request with 403 Forbidden.
    """
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Operation strictly restricted to ADMIN role. Database profile has role 'USER'.",
        )
    return current_user
