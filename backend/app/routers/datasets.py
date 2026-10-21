# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# Datasets Router (FastAPI)
# Strict Server-Side Authentication & RBAC (SIH26165)
# ============================================================

from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, Depends
from app.models.schemas import Dataset, CsvPipelineResult
from app.services.csv_service import process_csv_pipeline
from app.services.supabase_service import supabase_service
from app.services.auth_service import (
    require_admin,
    require_authenticated_user,
    AuthenticatedUser,
)

router = APIRouter(prefix="/datasets", tags=["Datasets"])


@router.get("", response_model=List[Dataset])
async def list_datasets(
    current_user: AuthenticatedUser = Depends(require_authenticated_user),
):
    return await supabase_service.list_datasets()


@router.post("/upload", response_model=CsvPipelineResult)
async def upload_csv(
    file: Optional[UploadFile] = File(None),
    raw_csv: Optional[str] = Form(None),
    filename: Optional[str] = Form(None),
    uploaded_by: Optional[str] = Form(None),
    current_user: AuthenticatedUser = Depends(require_admin),
):
    content = ""
    file_bytes = b""
    target_filename = filename or "uploaded_dataset.csv"

    if file:
        file_bytes = await file.read()
        try:
            content = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            content = file_bytes.decode("latin-1")
        target_filename = file.filename or target_filename
    elif raw_csv:
        content = raw_csv
        file_bytes = content.encode("utf-8")
    else:
        raise HTTPException(status_code=400, detail="No file or CSV text content provided.")

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
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline processing or persistence failed: {str(e)}")


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
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete dataset: {str(e)}")


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
