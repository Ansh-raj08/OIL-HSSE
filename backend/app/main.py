# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# FastAPI Application Entry Point (SIH26165 — Vercel Serverless Ready)
# - Minimal import-time work (lazy Supabase client)
# - Never crashes at startup when env vars are missing
# - Explicit CORS from environment variable
# - Public /api/health returns minimal status; detailed metrics require ADMIN token
# ============================================================

import uuid
from typing import Optional
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.services.supabase_service import supabase_service, BackendMisconfiguredError
from app.services.auth_service import try_get_admin_user
from app.routers import (
    incidents_router,
    datasets_router,
    analytics_router,
    rules_router,
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API and SIF Precursor Inference Engine for OIL HSSE Operations",
    docs_url="/docs",
    redoc_url="/redoc",
)


def _get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", f"req_{uuid.uuid4().hex[:8]}")


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    incoming = request.headers.get("X-Request-Id", "").strip()
    req_id = incoming[:32] if incoming and incoming.replace("-", "").replace("_", "").isalnum() else f"req_{uuid.uuid4().hex[:8]}"
    request.state.request_id = req_id
    response = await call_next(request)
    response.headers["X-Request-Id"] = req_id
    return response


# Explicit CORS configuration driven by CORS_ALLOWED_ORIGINS (never wildcard with credentials)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Request-Id"],
    expose_headers=["X-Request-Id"],
)


@app.exception_handler(BackendMisconfiguredError)
async def backend_misconfigured_handler(request: Request, exc: BackendMisconfiguredError):
    req_id = _get_request_id(request)
    return JSONResponse(
        status_code=503,
        content={
            "code": "backend_misconfigured",
            "detail": "The backend service is misconfigured.",
            "missing": exc.missing_vars,
            "requestId": req_id,
        },
        headers={"X-Request-Id": req_id},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    req_id = _get_request_id(request)
    default_codes = {
        400: "bad_request",
        401: "unauthorized",
        403: "forbidden",
        404: "not_found",
        413: "file_too_large",
        422: "validation_error",
        500: "internal_server_error",
        503: "service_unavailable",
    }

    if isinstance(exc.detail, dict):
        code = str(exc.detail.get("code") or default_codes.get(exc.status_code, f"http_{exc.status_code}"))
        message = str(exc.detail.get("message") or exc.detail.get("detail") or "Request failed.")
        payload = {
            "code": code,
            "detail": message,
            "requestId": req_id,
        }
        for k, v in exc.detail.items():
            if k not in ("code", "message", "detail"):
                payload[k] = v
    else:
        payload = {
            "code": default_codes.get(exc.status_code, f"http_{exc.status_code}"),
            "detail": str(exc.detail),
            "requestId": req_id,
        }

    headers = dict(exc.headers or {})
    headers["X-Request-Id"] = req_id
    return JSONResponse(status_code=exc.status_code, content=payload, headers=headers)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    req_id = _get_request_id(request)
    print(f"[Unhandled Error] requestId={req_id} path={request.url.path} error={type(exc).__name__}")
    return JSONResponse(
        status_code=500,
        content={
            "code": "internal_server_error",
            "detail": "An unexpected server error occurred.",
            "requestId": req_id,
        },
        headers={"X-Request-Id": req_id},
    )


# Mount data & rules routers under both /api and /api/v1
for prefix in ["/api", "/api/v1"]:
    app.include_router(incidents_router, prefix=prefix)
    app.include_router(datasets_router, prefix=prefix)
    app.include_router(analytics_router, prefix=prefix)
    app.include_router(rules_router, prefix=prefix)


@app.get("/api/health")
@app.get("/api/v1/health")
async def health_check(
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    """
    Public health check returns minimal status only (no internal details).
    If backend configuration is missing, returns configured=false and missing env var NAMES.
    Detailed diagnostics (Supabase mode, counts, latency, version) require a valid ADMIN token.
    """
    if not settings.USE_IN_MEMORY_DB:
        missing = supabase_service.get_missing_config_vars()
        if missing:
            return {
                "status": "misconfigured",
                "configured": False,
                "missing": missing,
            }

    admin_user = await try_get_admin_user(authorization)
    if admin_user is None:
        return {
            "status": "ok",
            "configured": True,
        }

    live_status = await supabase_service.check_live_query()
    return {
        "status": "ok",
        "configured": True,
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "databaseMode": "in-memory" if settings.USE_IN_MEMORY_DB else "supabase",
        "supabaseConfigured": supabase_service.is_configured,
        "supabaseReachable": live_status.get("status") == "ok",
        "liveQuery": live_status,
        "totalRecords": live_status.get("incidentCount", 0),
        "maxUploadBytes": settings.MAX_UPLOAD_BYTES,
    }
