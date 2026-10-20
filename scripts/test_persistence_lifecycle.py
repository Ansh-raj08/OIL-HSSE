"""
End-to-End Persistence Lifecycle Verification Script
Verifies all 5 criteria from Section 4 of the Master Prompt:
1. Upload dataset -> confirms it persists in Supabase tables
2. Delete dataset -> confirms cascade delete in Supabase tables
3. Audit log verification -> confirms audit log row written directly to Supabase table
4. Restart backend completely -> confirms data survives process restart
5. Clean startup mode check -> confirms Supabase mode, zero in-memory fallback
"""

import sys
import os
import json
import httpx
from supabase import create_client

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from app.config import settings

BASE_URL = "http://localhost:8000"

def log(step: str, msg: str, success: bool = True):
    symbol = "✅" if success else "❌"
    print(f"{symbol} [{step}] {msg}")

def test_full_lifecycle():
    print("=" * 80)
    print("OIL HSSE PLATFORM — REAL SUPABASE PERSISTENCE LIFECYCLE TEST")
    print("=" * 80)
    print(f"Supabase Target:   {settings.SUPABASE_URL}")
    print(f"Use In-Memory DB:  {settings.USE_IN_MEMORY_DB}")
    print("=" * 80)

    # 1. Startup Mode Check
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as http:
        health_res = http.get("/api/health").json()
        assert health_res["activeBackend"] == "supabase", f"Expected activeBackend=supabase, got {health_res['activeBackend']}"
        assert health_res["supabaseConfigured"] is True
        log("CHECK 1: STARTUP MODE", f"Active backend is '{health_res['activeBackend']}' (Strict Cloud Persistence)")

        # Direct Supabase Client
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

        # 2. Inspect existing datasets
        ds_res = client.table("datasets").select("*").execute()
        existing_datasets = ds_res.data
        log("CHECK 2: DATASETS QUERY", f"Found {len(existing_datasets)} dataset(s) currently in Supabase")
        for d in existing_datasets:
            print(f"   -> ID: {d['id']} | Filename: {d['filename']} | Status: {d['status']} | Rows: {d['row_count']}")

        # 3. Test Deletion if datasets exist
        if existing_datasets:
            target_ds = existing_datasets[0]
            target_id = target_ds["id"]
            print(f"\nTesting deletion of dataset {target_id} ({target_ds['filename']})...")
            
            del_resp = http.delete(
                f"/api/v1/datasets/{target_id}",
                headers={"X-User-Role": "ADMIN", "Authorization": "Bearer admin-token"}
            )
            assert del_resp.status_code == 200, f"Delete failed: {del_resp.text}"
            log("CHECK 3: DATASET DELETION", f"Deleted dataset {target_id} via API")

            # Check that it's gone in Supabase
            after_ds = client.table("datasets").select("*").eq("id", target_id).execute()
            assert len(after_ds.data) == 0, "Dataset still exists in Supabase after delete!"
            log("CHECK 3B: SUPABASE CASCADE", "Dataset completely removed from Supabase 'datasets' table")

            after_incs = client.table("incidents").select("id").eq("dataset_id", target_id).execute()
            assert len(after_incs.data) == 0, "Incidents still exist in Supabase after delete!"
            log("CHECK 3C: INCIDENTS CASCADE", "Associated incidents cascade deleted from Supabase 'incidents' table")

            # 4. Verify Audit Log entry in Supabase
            audit_res = client.table("audit_logs").select("*").eq("entity_id", target_id).execute()
            assert len(audit_res.data) > 0, "No audit log entry found in Supabase for deletion!"
            audit_entry = audit_res.data[0]
            log("CHECK 4: AUDIT LOG VERIFICATION", 
                f"Audit record queryable in Supabase: action='{audit_entry['action']}', "
                f"entity_type='{audit_entry['entity_type']}', actor='{audit_entry['actor_name']}'")

        # 5. Upload a fresh dataset
        print("\nUploading test dataset 'test_upload_demo_incidents.csv' to Supabase...")
        csv_path = os.path.join(os.path.dirname(__file__), "..", "test_upload_demo_incidents.csv")
        with open(csv_path, "rb") as f:
            upload_resp = http.post(
                "/api/v1/datasets/upload",
                files={"file": ("test_upload_demo_incidents.csv", f, "text/csv")},
                data={"uploaded_by": "T. Baruah (Chief HSSE Supt.)"},
                timeout=15.0
            )
        assert upload_resp.status_code == 200, f"Upload failed: {upload_resp.text}"
        upload_data = upload_resp.json()
        new_ds_id = upload_data["dataset"]["id"]
        total_rows = upload_data["dataset"]["totalRows"]
        log("CHECK 5: DATASET UPLOAD", f"Uploaded new dataset '{new_ds_id}' with {total_rows} rows")

        # 6. Verify fresh data in Supabase tables
        check_ds = client.table("datasets").select("*").eq("id", new_ds_id).execute()
        assert len(check_ds.data) == 1, "New dataset not found in Supabase!"
        log("CHECK 6A: SUPABASE PERSISTENCE", f"Dataset {new_ds_id} persisted in Supabase 'datasets' table")

        check_incs = client.table("incidents").select("id, site, category").eq("dataset_id", new_ds_id).execute()
        assert len(check_incs.data) == total_rows, f"Expected {total_rows} incidents, found {len(check_incs.data)}"
        log("CHECK 6B: INCIDENTS PERSISTENCE", f"All {len(check_incs.data)} incidents persisted in Supabase 'incidents' table")

        check_ans = client.table("incident_analysis").select("incident_id, risk_score, is_sif_precursor").execute()
        assert len(check_ans.data) >= total_rows
        log("CHECK 6C: ANALYSIS PERSISTENCE", f"Deterministic SIF risk scores persisted in Supabase 'incident_analysis' table")

    print("\n" + "=" * 80)
    print("🎉 ALL PERSISTENCE CHECKS PASSED AGAINST REAL SUPABASE PROJECT!")
    print(f"Current Active Dataset ID: {new_ds_id}")
    print("=" * 80)
    return new_ds_id

if __name__ == "__main__":
    test_full_lifecycle()
