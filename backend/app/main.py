# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# FastAPI Application Entry Point (SIH26165)
# ============================================================

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

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API and SIF Precursor Inference Engine for OIL HSSE Operations",
    docs_url="/docs",
    redoc_url="/redoc",
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
    kpis = await supabase_service.get_kpis()
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "activeBackend": "supabase" if supabase_service.is_configured else "in-memory",
        "supabaseConfigured": supabase_service.is_configured,
        "totalRecords": kpis.totalIngested,
    }

