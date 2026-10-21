# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# FastAPI Application Entry Point (SIH26165)
# ============================================================

import os
from contextlib import asynccontextmanager
from urllib.parse import urlparse
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.services.supabase_service import supabase_service
from app.routers import (
    incidents_router,
    datasets_router,
    analytics_router,
    auth_router,
    rules_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    supabase_host = urlparse(settings.SUPABASE_URL).netloc if settings.SUPABASE_URL else "not-configured"
    is_prod = (
        os.getenv("ENVIRONMENT") == "production"
        or os.getenv("VERCEL") == "1"
        or os.getenv("NODE_ENV") == "production"
    )
    if is_prod and not supabase_service.is_configured:
        raise RuntimeError(
            "FATAL: Production backend refused to start without valid Supabase credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)."
        )
    db_mode = "supabase" if supabase_service.is_configured else "in-memory"
    live_status = await supabase_service.check_live_query()
    print("=" * 80)
    print(f"[HEALTH STARTUP] mode={db_mode} | host={supabase_host} | liveQuery={live_status.get('status')} | latency={live_status.get('latencyMs')}ms | datasets={live_status.get('datasetCount')} | incidents={live_status.get('incidentCount')}")
    print("=" * 80)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API and SIF Precursor Inference Engine for OIL HSSE Operations",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permissive for local dev & internal deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers under both /api and /api/v1 for backwards and standard compatibility
for prefix in ["/api", "/api/v1"]:
    app.include_router(incidents_router, prefix=prefix)
    app.include_router(datasets_router, prefix=prefix)
    app.include_router(analytics_router, prefix=prefix)
    app.include_router(auth_router, prefix=prefix)
    app.include_router(rules_router, prefix=prefix)


@app.get("/api/health")
@app.get("/api/v1/health")
async def health_check():
    supabase_host = urlparse(settings.SUPABASE_URL).netloc if settings.SUPABASE_URL else "not-configured"
    live_status = await supabase_service.check_live_query()
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "databaseMode": "supabase" if supabase_service.is_configured else "in-memory",
        "supabaseHost": supabase_host,
        "liveQuery": live_status,
        "totalRecords": live_status.get("incidentCount", 0),
        "supabaseConfigured": supabase_service.is_configured,
    }

