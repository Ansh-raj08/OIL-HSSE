# OIL HSSE Enterprise SIF-Precursor Platform — REST API Contract
**Version:** v2.2.0 (SIH26165)  
**Base URL:** `/api` (Production / Uvicorn server on port 8000)

---

## 1. Authentication & Role Model
All mutating operations (confirm, escalate, override, delete dataset) strictly enforce server-side Role-Based Access Control (RBAC).

| Header | Format | Allowed Values | Description |
|---|---|---|---|
| `X-User-Role` | String | `ADMIN`, `USER` | Direct role header |
| `Authorization` | Bearer token | `Bearer ADMIN`, `Bearer USER` | Standard authorization header |

**Permissions**:
- `ADMIN`: Full authority. Can confirm, escalate, override, upload, and delete datasets.
- `USER`: Read-only access. Non-admin calls to mutating endpoints are rejected with `403 Forbidden`.

---

## 2. Incident Endpoints (`/api/incidents`)

### `GET /api/incidents`
Lists paginated incidents with filtering.
- **Query Parameters**:
  - `category`: `UNSAFE_ACT | UNSAFE_CONDITION | NEAR_MISS`
  - `riskLevel`: `CRITICAL | HIGH | MEDIUM | LOW`
  - `status`: `PENDING | CONFIRMED | OVERRIDDEN`
  - `search`: string search across narrative, site, LSR
  - `page`: int (default 1)
  - `pageSize`: int (default 50)
- **Response**: `200 OK` — `{ "incidents": [...], "total": int, "page": int, "pageSize": int, "totalPages": int }`

### `POST /api/incidents/ingest`
Submits a single field observation log and computes real-time deterministic risk score, IOGP LSR, XAI triggers, and Hierarchy of Controls.
- **Request Body**:
  ```json
  {
    "site": "Duliajan Rig #7 (Drilling Ops)",
    "category": "UNSAFE_ACT",
    "reportedBy": "P. Phukan (Lead Toolpusher)",
    "rawNarrative": "Observed worker without safety harness at 10m height."
  }
  ```
- **Response**: `200 OK` — `SafetyIncident` object.

### `POST /api/incidents/{id}/confirm`
Confirms and escalates a detected SIF precursor into an official emergency stop-work action.
- **Authorization**: `ADMIN` only (403 Forbidden for `USER`).
- **Request Body**: `{ "reviewer_id": "T. Baruah", "escalation_notes": "Stop-work order issued." }`
- **Response**: `200 OK` — Updated `SafetyIncident` with `validationStatus = "CONFIRMED"`.

### `POST /api/incidents/{id}/override`
Downgrades or overrides an automated SIF precursor flag with mandatory technical regulatory justification.
- **Authorization**: `ADMIN` only (403 Forbidden for `USER`).
- **Request Body**:
  ```json
  {
    "reviewer_id": "T. Baruah",
    "target_level": "LOW",
    "justification": "Verified secondary independent mechanical stop installed."
  }
  ```
- **Response**: `200 OK` — Updated `SafetyIncident` with `validationStatus = "OVERRIDDEN"`.

---

## 3. Dataset Endpoints (`/api/datasets`)

### `GET /api/datasets`
Lists all ingested datasets from backend/Supabase storage.
- **Response**: `200 OK` — Array of `Dataset` records (`id`, `filename`, `uploadedAt`, `totalRows`, `validRows`, etc.).

### `POST /api/datasets/upload`
Uploads a batch CSV file and executes the 5-stage syntactic parsing, cleaning, normalization, and SIF inference pipeline.
- **Body**: Multipart form data (`file` or `raw_csv`, `filename`).
- **Response**: `200 OK` — `CsvPipelineResult`.

### `DELETE /api/datasets/{dataset_id}`
Permanently deletes an ingested dataset and cascade-deletes its derived incidents, analysis, and reviews.
- **Authorization**: **Strict server-side check requires `ADMIN` role** (`403 Forbidden` for `USER` or unauthenticated calls).
- **Compliance Requirement**: Creates an **immutable regulatory audit log entry** in `audit_logs` **before** the delete executes. The audit log is never cascade-deleted.
- **Query Parameters**:
  - `actor_name` (optional): Name of the administrator executing the deletion.
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Dataset OIL_Assam_Drilling_Q1_2026.csv and 12 associated incidents deleted successfully.",
    "datasetId": "d0000000-0000-0000-0000-000000000001",
    "filename": "OIL_Assam_Drilling_Q1_2026.csv",
    "deletedIncidentsCount": 12,
    "auditLogId": "a1b2c3d4-..."
  }
  ```
- **Errors**:
  - `403 Forbidden`: Caller does not possess `ADMIN` role.
  - `404 Not Found`: Dataset ID does not exist.

### `GET /api/datasets/audit-logs`
Retrieves immutable regulatory audit logs for compliance inspection (OISD-105 / DGMS).
- **Response**: `200 OK` — Array of audit log entries.

### `GET /api/datasets/{dataset_id}/audit-logs`
Retrieves audit log entries specifically associated with a given dataset ID.

---

## 4. Analytics Endpoints (`/api/analytics`)

### `GET /api/analytics/kpi`
Returns global operational KPI summary metrics:
```json
{
  "totalIngested": 12,
  "flaggedSif": 4,
  "pendingReview": 2,
  "complianceRate": 83
}
```

### `GET /api/analytics/summary`
Returns detailed risk distributions, IOGP Life-Saving Rules violation breakdowns, and installation hazard distributions.
