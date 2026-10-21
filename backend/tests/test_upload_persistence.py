# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# End-to-End Upload Persistence Integration Test Suite (SIH26165)
# Proves:
# 1. Non-admin token gets 403 Forbidden on upload.
# 2. Admin token uploads 01_valid_basic.csv -> 200 OK.
# 3. Data persists to Supabase public.datasets and public.incidents.
# 4. Raw file persists to Supabase Storage 'raw-datasets' bucket.
# 5. Non-admin user can read the uploaded dataset & incidents (Visibility).
# 6. Admin can delete dataset -> cascade deletes incidents, audit log entry recorded.
# ============================================================

import os
import io
import pytest
from fastapi.testclient import TestClient
from supabase import create_client
from dotenv import load_dotenv

# Ensure backend .env is loaded with Supabase mode active
os.environ["USE_IN_MEMORY_DB"] = "false"
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"), override=True)

from app.main import app
from app.config import settings

client = TestClient(app)


@pytest.fixture(scope="module")
def supabase_admin():
    assert settings.SUPABASE_URL, "SUPABASE_URL must be configured"
    assert settings.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY must be configured"
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


@pytest.fixture(scope="module")
def auth_tokens():
    """Authenticate real test accounts against Supabase Auth to obtain valid JWTs."""
    anon_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    
    admin_auth = anon_client.auth.sign_in_with_password({
        "email": "admin@oilindia.in",
        "password": "oil_hsse_admin_2026!",
    })
    user_auth = anon_client.auth.sign_in_with_password({
        "email": "user@oilindia.in",
        "password": "oil_hsse_user_2026!",
    })
    
    return {
        "admin": admin_auth.session.access_token,
        "user": user_auth.session.access_token,
    }


def test_health_check_supabase_mode():
    """Health check must report live Supabase connection with 200."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["databaseMode"] == "supabase"
    assert data["supabaseConfigured"] is True
    assert data["liveQuery"]["status"] == "ok"


def test_non_admin_upload_rejected_with_403(auth_tokens):
    """A non-admin user must be refused by RBAC with 403 Forbidden."""
    user_token = auth_tokens["user"]
    fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "01_valid_basic.csv")
    with open(fixture_path, "rb") as f:
        file_bytes = f.read()

    res = client.post(
        "/api/datasets/upload",
        headers={"Authorization": f"Bearer {user_token}"},
        files={"file": ("01_valid_basic.csv", io.BytesIO(file_bytes), "text/csv")},
        data={"filename": "01_valid_basic.csv", "uploaded_by": "Field Observer"},
    )
    assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}: {res.text}"
    assert "Forbidden" in res.json().get("detail", "")
    assert "ADMIN" in res.json().get("detail", "")


def test_admin_upload_persists_to_supabase_and_storage(auth_tokens, supabase_admin):
    """
    1. Check initial Supabase row counts.
    2. Upload 01_valid_basic.csv with Admin token.
    3. Assert rows were inserted into Supabase (datasets and incidents increased).
    4. Assert file object stored in 'raw-datasets' bucket.
    5. Assert non-admin user can read the dataset and incidents.
    6. Admin deletes dataset and asserts clean cascade deletion.
    """
    admin_token = auth_tokens["admin"]
    user_token = auth_tokens["user"]
    
    # 1. Initial count check
    initial_datasets = supabase_admin.from_("datasets").select("*", count="exact", head=True).execute().count or 0
    initial_incidents = supabase_admin.from_("incidents").select("*", count="exact", head=True).execute().count or 0

    # 2. Upload with Admin token
    fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "01_valid_basic.csv")
    with open(fixture_path, "rb") as f:
        file_bytes = f.read()

    upload_res = client.post(
        "/api/datasets/upload",
        headers={"Authorization": f"Bearer {admin_token}"},
        files={"file": ("01_valid_basic.csv", io.BytesIO(file_bytes), "text/csv")},
        data={"filename": "01_valid_basic.csv", "uploaded_by": "Chief HSSE Supt."},
    )
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.status_code} - {upload_res.text}"
    
    upload_data = upload_res.json()
    dataset_id = upload_data["dataset"]["id"]
    valid_rows = upload_data["dataset"]["validRows"]
    assert valid_rows == 10
    assert len(upload_data["incidents"]) == 10

    # 3. Check Supabase DB rows increased
    after_datasets = supabase_admin.from_("datasets").select("*", count="exact", head=True).execute().count or 0
    after_incidents = supabase_admin.from_("incidents").select("*", count="exact", head=True).execute().count or 0
    assert after_datasets == initial_datasets + 1, f"Expected {initial_datasets + 1} datasets, found {after_datasets}"
    assert after_incidents == initial_incidents + 10, f"Expected {initial_incidents + 10} incidents, found {after_incidents}"

    # Verify specific dataset in DB
    db_dataset = supabase_admin.from_("datasets").select("*").eq("id", dataset_id).single().execute()
    assert db_dataset.data["id"] == dataset_id
    assert db_dataset.data["filename"] == "01_valid_basic.csv"
    assert db_dataset.data["valid_row_count"] == 10

    # Verify specific incidents in DB
    db_incidents = supabase_admin.from_("incidents").select("*").eq("dataset_id", dataset_id).execute()
    assert len(db_incidents.data) == 10

    # 4. Check file in raw-datasets storage bucket
    storage_objects = supabase_admin.storage.from_("raw-datasets").list(dataset_id)
    stored_names = [obj["name"] for obj in storage_objects]
    assert "01_valid_basic.csv" in stored_names, f"File not found in storage bucket under {dataset_id}: {stored_names}"

    # 5. Read Visibility Check: non-admin user must see the new dataset and incidents
    try:
        user_datasets_res = client.get("/api/datasets", headers={"Authorization": f"Bearer {user_token}"})
        assert user_datasets_res.status_code == 200
        user_dataset_ids = [d["id"] for d in user_datasets_res.json()]
        assert dataset_id in user_dataset_ids, f"Dataset {dataset_id} not visible to standard user!"

        user_incidents_res = client.get("/api/incidents", headers={"Authorization": f"Bearer {user_token}"})
        assert user_incidents_res.status_code == 200
        incident_list = user_incidents_res.json().get("incidents", [])
        incident_dataset_ids = [i.get("datasetId") for i in incident_list]
        assert dataset_id in incident_dataset_ids, f"Incidents from {dataset_id} not visible to standard user!"
    finally:
        # 6. Admin Cascade Deletion Check
        del_res = client.delete(f"/api/datasets/{dataset_id}", headers={"Authorization": f"Bearer {admin_token}"})
        assert del_res.status_code == 200, f"Delete failed: {del_res.status_code} - {del_res.text}"

    # Verify counts returned to initial
    final_datasets = supabase_admin.from_("datasets").select("*", count="exact", head=True).execute().count or 0
    final_incidents = supabase_admin.from_("incidents").select("*", count="exact", head=True).execute().count or 0
    assert final_datasets == initial_datasets
    assert final_incidents == initial_incidents

    # Verify audit log entry exists
    audit_res = supabase_admin.from_("audit_logs").select("*").eq("entity_id", dataset_id).execute()
    assert len(audit_res.data) >= 1
    actions = [a["action"] for a in audit_res.data]
    assert "DATASET_DELETED" in actions
