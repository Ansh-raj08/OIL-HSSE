# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# Backend Server Runner
# ============================================================

import uvicorn
from app.config import settings

if __name__ == "__main__":
    print(f"🚀 Starting OIL HSSE Backend on http://{settings.HOST}:{settings.PORT}")
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
        log_level="info",
    )
