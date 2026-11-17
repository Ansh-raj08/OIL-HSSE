# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# FastAPI Backend Configuration (SIH26165)
# Serverless-safe (Vercel) with lazy validation & explicit CORS
# ============================================================

import os
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv

# Load .env from both cwd and backend root directory (local dev only; no-op on Vercel)
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
load_dotenv()


def _parse_origins(raw: str) -> List[str]:
    origins: List[str] = []
    for item in (raw or "").split(","):
        cleaned = item.strip().rstrip("/")
        if cleaned and cleaned != "*":
            origins.append(cleaned)
    return origins


def _is_production_env() -> bool:
    return (
        os.getenv("VERCEL") == "1"
        or os.getenv("ENVIRONMENT", "").lower() == "production"
        or os.getenv("NODE_ENV", "").lower() == "production"
    )


def _resolve_cors_origins() -> List[str]:
    raw = (
        os.getenv("CORS_ALLOWED_ORIGINS")
        or os.getenv("ALLOWED_ORIGINS")
        or os.getenv("FRONTEND_URL")
        or ""
    )
    configured = _parse_origins(raw)
    if configured:
        return configured
    if _is_production_env():
        # In production, never fall back to wildcard or localhost
        return []
    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]


class Settings(BaseModel):
    APP_NAME: str = "OIL HSSE SIF-Precursor Decision-Support API"
    APP_VERSION: str = "v2.6.0 · PR2"
    HOST: str = os.getenv("API_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("API_PORT", "8000"))

    # Exact allowed origins for CORS (from CORS_ALLOWED_ORIGINS env var in production)
    CORS_ORIGINS: List[str] = _resolve_cors_origins()

    # Supabase Credentials
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", os.getenv("NEXT_PUBLIC_SUPABASE_URL", ""))
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""))
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv(
        "SUPABASE_SERVICE_ROLE_KEY",
        os.getenv("SUPABASE_SECRET_KEY", ""),
    )

    # Upload size limit in bytes (default 4 MB, safely under Vercel's 4.5 MB serverless payload limit)
    MAX_UPLOAD_BYTES: int = int(os.getenv("MAX_UPLOAD_BYTES", str(4 * 1024 * 1024)))

    # In-memory database flag: only activated when explicitly opting in via USE_IN_MEMORY_DB=true (local tests only)
    USE_IN_MEMORY_DB: bool = os.getenv("USE_IN_MEMORY_DB", "false").lower() in ("true", "1", "yes")

    @property
    def is_production(self) -> bool:
        return _is_production_env()

    @property
    def active_supabase_key(self) -> str:
        return (self.SUPABASE_SERVICE_ROLE_KEY or self.SUPABASE_KEY or "").strip()

    def get_missing_config_vars(self) -> List[str]:
        """Returns the list of missing or placeholder required environment variable NAMES (never values)."""
        missing: List[str] = []

        url = (self.SUPABASE_URL or "").strip()
        if (
            not url
            or "your-project" in url.lower()
            or not (url.startswith("https://") or url.startswith("http://"))
        ):
            missing.append("SUPABASE_URL")

        key = self.active_supabase_key
        if not key or "your-supabase" in key.lower():
            missing.append("SUPABASE_SERVICE_ROLE_KEY")

        return missing


settings = Settings()
