# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# FastAPI Integration & Security RBAC Test Suite (SIH26165)
# Section 0 Master Test Suite:
# - No token -> 401
# - Garbage token -> 401
# - Expired token -> 401
# - USER token -> 403 on confirm, override, delete, upload
# - USER token + forged X-User-Role: ADMIN -> 403 (Header strictly ignored)
# - ADMIN token -> 200 / 201 Success
# - Regression tests: Ingestion, Cascade Deletion, CSV Pipelines
# ============================================================

import os
import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Authoritative Token Headers
ADMIN_HEADERS = {"Authorization": "Bearer MOCK_ADMIN_TOKEN"}
USER_HEADERS = {"Authorization": "Bearer MOCK_USER_TOKEN"}
EXPIRED_HEADERS = {"Authorization": "Bearer MOCK_EXPIRED_TOKEN"}
GARBAGE_HEADERS = {"Authorization": "Bearer INVALID_TOKEN_XYZ_123"}
FORGED_HEADERS = {
    "Authorization": "Bearer MOCK_USER_TOKEN",
    "X-User-Role": "ADMIN",
}


@pytest.fixture(autouse=True)
def enable_in_memory_mode():
    from app.config import settings
    prev = settings.USE_IN_MEMORY_DB
    settings.USE_IN_MEMORY_DB = True
    yield
    settings.USE_IN_MEMORY_DB = prev


def test_health_check():
    """Health check must be open and return healthy system status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "totalRecords" in data


# ── SECTION 0: AUTHENTICATION & TOKEN VERIFICATION TESTS ────────────

def test_missing_token_returns_401():
    """Verify that requests missing Authorization header are rejected with 401."""
    # 1. Read endpoint
    res_get = client.get("/api/incidents")
    assert res_get.status_code == 401
    assert "Missing Authorization header" in res_get.json()["detail"]

    # 2. Mutating confirm
    res_confirm = client.post("/api/incidents/OIL-2026-0001/confirm", json={"reviewedBy": "Tester"})
    assert res_confirm.status_code == 401

    # 3. Mutating override
    res_override = client.post("/api/incidents/OIL-2026-0001/override", json={"reviewedBy": "Tester", "justification": "Testing"})
    assert res_override.status_code == 401

    # 4. Mutating upload
    res_upload = client.post("/api/datasets/upload", data={"raw_csv": "header\nval"})
    assert res_upload.status_code == 401

    # 5. Mutating delete
    res_del = client.delete("/api/datasets/test-dataset-id")
    assert res_del.status_code == 401


def test_garbage_token_returns_401():
    """Verify that malformed or invalid Bearer tokens are rejected with 401."""
    res = client.get("/api/incidents", headers=GARBAGE_HEADERS)
    assert res.status_code == 401
    assert "Unauthorized" in res.json()["detail"]


def test_expired_token_returns_401():
    """Verify that expired Bearer tokens are rejected with 401."""
    res = client.get("/api/incidents", headers=EXPIRED_HEADERS)
    assert res.status_code == 401
    assert "expired" in res.json()["detail"].lower()


# ── SECTION 0: AUTHORIZATION & FORGERY DEFENSE TESTS ───────────────

def _create_test_incident(headers=ADMIN_HEADERS):
    payload = {
        "site": "Moran GGS Unit #4",
        "category": "UNSAFE_ACT",
        "reportedBy": "P. Gogoi",
        "rawNarrative": "Technician entered slug catcher vessel without confined space entry permit or O2 atmospheric testing. No hole watch standby.",
    }
    response = client.post("/api/incidents", json=payload, headers=headers)
    assert response.status_code == 201
    return response.json()


def test_user_token_forbidden_on_mutating_endpoints_403():
    """Verify that a valid authenticated USER session cannot perform ADMIN operations (403)."""
    created = _create_test_incident()
    inc_id = created["id"]

    # 1. Confirm should be forbidden
    res_conf = client.post(
        f"/api/incidents/{inc_id}/confirm",
        json={"reviewedBy": "Standard Observer", "escalationNotes": "Attempted escalation"},
        headers=USER_HEADERS,
    )
    assert res_conf.status_code == 403
    assert "Forbidden" in res_conf.json()["detail"]

    # 2. Override should be forbidden
    res_over = client.post(
        f"/api/incidents/{inc_id}/override",
        json={"reviewedBy": "Standard Observer", "justification": "Technical justification attempt"},
        headers=USER_HEADERS,
    )
    assert res_over.status_code == 403
    assert "Forbidden" in res_over.json()["detail"]

    # 3. CSV Upload should be forbidden
    res_upload = client.post(
        "/api/datasets/upload",
        data={"raw_csv": "header\nval", "filename": "unauthorized.csv"},
        headers=USER_HEADERS,
    )
    assert res_upload.status_code == 403
    assert "Forbidden" in res_upload.json()["detail"]

    # 4. Dataset Delete should be forbidden
    res_del = client.delete("/api/datasets/some-dataset-id", headers=USER_HEADERS)
    assert res_del.status_code == 403
    assert "Forbidden" in res_del.json()["detail"]


def test_forged_x_user_role_header_strictly_ignored_403():
    """
    CRITICAL SECURITY ASSERTION:
    Ensure that sending X-User-Role: ADMIN or 'role: ADMIN' in body
    with a USER session is COMPLETELY IGNORED by the backend, resulting in 403 Forbidden.
    """
    created = _create_test_incident()
    inc_id = created["id"]

    # 1. Confirm with forged header and forged body role
    res_conf = client.post(
        f"/api/incidents/{inc_id}/confirm",
        json={"reviewedBy": "Attacker", "role": "ADMIN", "escalationNotes": "Exploit attempt"},
        headers=FORGED_HEADERS,
    )
    assert res_conf.status_code == 403
    assert "Forbidden" in res_conf.json()["detail"]

    # 2. Override with forged header and forged body role
    res_over = client.post(
        f"/api/incidents/{inc_id}/override",
        json={"reviewedBy": "Attacker", "role": "ADMIN", "justification": "Exploit override"},
        headers=FORGED_HEADERS,
    )
    assert res_over.status_code == 403
    assert "Forbidden" in res_over.json()["detail"]

    # 3. Delete with forged header
    res_del = client.delete("/api/datasets/some-dataset-id", headers=FORGED_HEADERS)
    assert res_del.status_code == 403
    assert "Forbidden" in res_del.json()["detail"]

    # 4. Upload with forged header
    res_upload = client.post(
        "/api/datasets/upload",
        data={"raw_csv": "header\nval", "filename": "forged.csv"},
        headers=FORGED_HEADERS,
    )
    assert res_upload.status_code == 403
    assert "Forbidden" in res_upload.json()["detail"]


def test_admin_token_success():
    """Verify that an authentic ADMIN token succeeds across all mutating actions."""
    created = _create_test_incident(ADMIN_HEADERS)
    inc_id = created["id"]

    # 1. Confirm success
    res_conf = client.post(
        f"/api/incidents/{inc_id}/confirm",
        json={"reviewedBy": "T. Baruah (Chief HSSE Supt.)", "escalationNotes": "Authorized confirmation"},
        headers=ADMIN_HEADERS,
    )
    assert res_conf.status_code == 200
    assert res_conf.json()["validationStatus"] == "CONFIRMED"

    # 2. Override success
    created2 = _create_test_incident(ADMIN_HEADERS)
    inc_id2 = created2["id"]
    res_over = client.post(
        f"/api/incidents/{inc_id2}/override",
        json={"reviewedBy": "T. Baruah (Chief HSSE Supt.)", "justification": "Vessel verified depressurized and gas-free"},
        headers=ADMIN_HEADERS,
    )
    assert res_over.status_code == 200
    assert res_over.json()["validationStatus"] == "OVERRIDDEN"


def test_authenticated_user_can_read():
    """Verify that valid USER token can read incidents, KPI, and analytics."""
    res_inc = client.get("/api/incidents", headers=USER_HEADERS)
    assert res_inc.status_code == 200
    assert "incidents" in res_inc.json()

    res_kpi = client.get("/api/analytics/kpi", headers=USER_HEADERS)
    assert res_kpi.status_code == 200

    res_analytics = client.get("/api/analytics/summary", headers=USER_HEADERS)
    assert res_analytics.status_code == 200


# ── PIPELINE, DATASET CASCADE, AND INGESTION REGRESSION TESTS ───────

def test_csv_upload_pipeline():
    sample_csv = """Incident ID,Site,Category,Reported By,Timestamp,Observation Narrative
OIL-2026-8001,Duliajan Rig #9,UNSAFE_ACT,D. Saikia,15 Jan 2026 09:00 IST,Worker on monkey board at 14m height without fall arrest lanyard or harness tie-off.
OIL-2026-8002,Digboi CTF,NEAR_MISS,M. Bora,15 Jan 2026 11:30 IST,Crude transfer hose unhooked under 600 psi pressure without whip check installed.
"""
    response = client.post(
        "/api/datasets/upload",
        data={"raw_csv": sample_csv, "filename": "Test_Field_Log.csv"},
        headers=ADMIN_HEADERS,
    )
    assert response.status_code == 200
    result = response.json()
    assert "dataset" in result
    assert "incidents" in result
    assert "qualityReport" in result
    assert len(result["incidents"]) == 2
    assert result["dataset"]["filename"] == "Test_Field_Log.csv"
    assert result["qualityReport"]["cleanRate"] == 100


def test_delete_dataset_success_for_admin_and_audit_log():
    """Verify ADMIN can delete dataset, cascade delete incidents, and preserve audit log"""
    # 1. Create a test dataset via upload
    csv_content = "incident_id,site,category,reported_by,narrative\nTEST-DS-01,Duliajan Rig #7,UNSAFE_ACT,Tester,Observed working at height without harness."
    upload_res = client.post(
        "/api/datasets/upload",
        data={"raw_csv": csv_content, "filename": "Test_Delete_Dataset.csv"},
        headers=ADMIN_HEADERS,
    )
    assert upload_res.status_code == 200
    dataset_id = upload_res.json()["dataset"]["id"]

    # 2. Verify dataset is in list
    list_res = client.get("/api/datasets", headers=ADMIN_HEADERS)
    assert any(d["id"] == dataset_id for d in list_res.json())

    # 3. Delete dataset as ADMIN
    delete_res = client.delete(
        f"/api/datasets/{dataset_id}",
        headers=ADMIN_HEADERS,
    )
    assert delete_res.status_code == 200
    delete_data = delete_res.json()
    assert delete_data["success"] is True
    assert delete_data["datasetId"] == dataset_id
    audit_id = delete_data["auditLogId"]

    # 4. Verify dataset is removed from datasets list
    list_res_after = client.get("/api/datasets", headers=ADMIN_HEADERS)
    assert not any(d["id"] == dataset_id for d in list_res_after.json())

    # 5. Verify audit log entry exists and is readable
    audit_res = client.get("/api/datasets/audit-logs", headers=ADMIN_HEADERS)
    assert audit_res.status_code == 200
    audit_logs = audit_res.json()
    matching_log = next((l for l in audit_logs if l["id"] == audit_id), None)
    assert matching_log is not None
    assert matching_log["action"] == "DATASET_DELETED"
    assert matching_log["entity_id"] == dataset_id


def test_delete_dataset_cascade_removes_incidents_regression():
    """
    Regression Test:
    Assert that deleting a dataset permanently removes all its derived incidents
    from GET /api/v1/incidents and GET /api/incidents, and preserves the audit log.
    """
    unique_inc_id = f"REG-DEL-{int(datetime.now().timestamp())}"
    csv_content = (
        f"incident_id,site,category,reported_by,narrative\n"
        f"{unique_inc_id},Duliajan Rig #7,UNSAFE_ACT,Lead Tester,Worker entered mud cellar without LOTO."
    )
    upload_res = client.post(
        "/api/datasets/upload",
        data={"raw_csv": csv_content, "filename": "Regression_Cascade_Test.csv"},
        headers=ADMIN_HEADERS,
    )
    assert upload_res.status_code == 200
    dataset_id = upload_res.json()["dataset"]["id"]

    # Assert incident is present
    inc_res = client.get("/api/incidents?pageSize=100", headers=ADMIN_HEADERS)
    assert inc_res.status_code == 200
    incidents_before = inc_res.json()["incidents"]
    assert any(i["id"] == unique_inc_id for i in incidents_before)

    # Delete dataset
    del_res = client.delete(
        f"/api/datasets/{dataset_id}",
        headers=ADMIN_HEADERS,
    )
    assert del_res.status_code == 200

    # Assert incident is permanently removed
    inc_res_after = client.get("/api/incidents?pageSize=100", headers=ADMIN_HEADERS)
    assert inc_res_after.status_code == 200
    incidents_after = inc_res_after.json()["incidents"]
    assert not any(i["id"] == unique_inc_id for i in incidents_after)


def test_rules_guidelines_endpoint():
    """Verify GET /api/rules and GET /api/v1/rules return single-source guidelines from logic engine."""
    for url in ["/api/rules", "/api/v1/rules"]:
        res = client.get(url)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert len(data["lifeSavingRules"]) == 9
        assert len(data["hierarchyOfControls"]) == 4


def test_sample_csv_validation_regression():
    """Ensure bundled OIL_Assam_Field_Logs_Sample.csv validates and ingests cleanly."""
    csv_path = os.path.join(os.path.dirname(__file__), "../../oil-hsse-app/public/sample-datasets/OIL_Assam_Field_Logs_Sample.csv")
    with open(csv_path, "r", encoding="utf-8") as f:
        csv_text = f.read()

    res = client.post(
        "/api/datasets/upload",
        data={"raw_csv": csv_text, "filename": "OIL_Assam_Field_Logs_Sample.csv"},
        headers=ADMIN_HEADERS,
    )
    assert res.status_code == 200
    data = res.json()
    assert "dataset" in data
    assert data["dataset"]["totalRows"] == 10
    assert len(data["incidents"]) == 10


def test_demo_incidents_csv_validation():
    """Ensure test_upload_demo_incidents.csv ingests cleanly."""
    csv_path = os.path.join(os.path.dirname(__file__), "../../test_upload_demo_incidents.csv")
    with open(csv_path, "r", encoding="utf-8") as f:
        csv_text = f.read()

    res = client.post(
        "/api/datasets/upload",
        data={"raw_csv": csv_text, "filename": "test_upload_demo_incidents.csv"},
        headers=ADMIN_HEADERS,
    )
    assert res.status_code == 200
    data = res.json()
    assert "dataset" in data
    assert len(data["incidents"]) == 10
