# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# Datasets Router (FastAPI)
# Strict Server-Side Authentication, Upload Size Limits & RBAC (SIH26165)
# ============================================================

from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, Depends, Request
from app.config import settings
from app.models.schemas import Dataset, CsvPipelineResult
from app.services.csv_service import process_csv_pipeline
from app.services.supabase_service import supabase_service, BackendMisconfiguredError
from app.services.auth_service import (
    require_admin,
    require_authenticated_user,
    AuthenticatedUser,
)

router = APIRouter(prefix="/datasets", tags=["Datasets"])


def _raise_payload_too_large(max_bytes: int) -> None:
    max_mb = round(max_bytes / (1024 * 1024), 1)
    raise HTTPException(
        status_code=413,
        detail={
            "code": "file_too_large",
            "message": f"Uploaded file exceeds the maximum allowed size of {max_mb} MB.",
            "maxBytes": max_bytes,
        },
    )


@router.get("", response_model=List[Dataset])
async def list_datasets(
    current_user: AuthenticatedUser = Depends(require_authenticated_user),
):
    return await supabase_service.list_datasets()


@router.post("/upload", response_model=CsvPipelineResult)
async def upload_csv(
    request: Request,
    file: Optional[UploadFile] = File(None),
    raw_csv: Optional[str] = Form(None),
    filename: Optional[str] = Form(None),
    uploaded_by: Optional[str] = Form(None),
    current_user: AuthenticatedUser = Depends(require_admin),
):
    max_bytes = settings.MAX_UPLOAD_BYTES

    # Early check on Content-Length header before reading payload into memory
    content_length_hdr = request.headers.get("content-length")
    if content_length_hdr:
        try:
            # Allow modest multipart boundary overhead (+64 KB) on Content-Length check
            if int(content_length_hdr) > max_bytes + 65536:
                _raise_payload_too_large(max_bytes)
        except ValueError:
            pass

    content = ""
    file_bytes = b""
    target_filename = filename or "uploaded_dataset.csv"

    if file:
        # Read at most max_bytes + 1 to detect oversized files early without exhausting memory
        chunks = []
        total_read = 0
        while True:
            chunk = await file.read(65536)
            if not chunk:
                break
            total_read += len(chunk)
            if total_read > max_bytes:
                _raise_payload_too_large(max_bytes)
            chunks.append(chunk)
        file_bytes = b"".join(chunks)
        try:
            content = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            content = file_bytes.decode("latin-1")
        target_filename = file.filename or target_filename
    elif raw_csv is not None:
        file_bytes = raw_csv.encode("utf-8")
        if len(file_bytes) > max_bytes:
            _raise_payload_too_large(max_bytes)
        content = raw_csv
    else:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "missing_file",
                "message": "No file or CSV text content provided.",
            },
        )

    try:
        uploader_name = uploaded_by or current_user.full_name or "Administrator"
        result = process_csv_pipeline(
            content=content,
            filename=target_filename,
            uploaded_by=uploader_name,
        )
        await supabase_service.save_pipeline_result(
            result=result,
            file_bytes=file_bytes,
            uploader_user=current_user,
        )
        return result
    except BackendMisconfiguredError:
        raise
    except ValueError as ve:
        msg = str(ve)
        code = "csv_missing_columns" if "Missing required column" in msg else (
            "csv_empty" if "empty" in msg.lower() else "invalid_csv"
        )
        raise HTTPException(status_code=422, detail={"code": code, "message": msg})
    except Exception:
        raise HTTPException(
            status_code=500,
            detail={
                "code": "upload_persistence_failed",
                "message": "Failed to process or persist the uploaded dataset.",
            },
        )


@router.delete("/{dataset_id}")
async def delete_dataset(
    dataset_id: str,
    actor_name: Optional[str] = Query(None),
    current_user: AuthenticatedUser = Depends(require_admin),
):
    """
    Delete a dataset and cascade-delete its derived incidents and analysis.
    Protected endpoint: Strict server-side RBAC requires authenticated ADMIN role.
    Records an immutable regulatory audit log entry prior to deletion.
    """
    try:
        effective_actor = actor_name or current_user.full_name or "Administrator"
        result = await supabase_service.delete_dataset(dataset_id, actor_name=effective_actor)
        return result
    except BackendMisconfiguredError:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=404, detail={"code": "dataset_not_found", "message": str(ve)})
    except Exception:
        raise HTTPException(
            status_code=500,
            detail={
                "code": "delete_failed",
                "message": "Failed to delete dataset.",
            },
        )


@router.get("/audit-logs")
async def get_all_audit_logs(
    current_user: AuthenticatedUser = Depends(require_authenticated_user),
):
    """
    Retrieve immutable regulatory audit log trail (OISD-105 / DGMS).
    """
    return await supabase_service.get_audit_logs()


@router.get("/{dataset_id}/audit-logs")
async def get_dataset_audit_logs(
    dataset_id: str,
    current_user: AuthenticatedUser = Depends(require_authenticated_user),
):
    """
    Retrieve audit log entries for a specific dataset ID.
    """
    return await supabase_service.get_audit_logs(entity_id=dataset_id)
