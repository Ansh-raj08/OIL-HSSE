# OIL HSSE Enterprise SIF-Precursor Decision-Support Platform
## Project Progress, Architecture & Changelog Master Record

> **Problem Statement ID:** SIH26165  
> **Problem Statement Title:** AI/NLP Engine to Detect Serious Injury & Fatality (SIF) Precursors in OIL's Unsafe-Act / Unsafe-Condition and Near-Miss Reports  
> **Client / Domain:** Oil India Limited (OIL) — Upstream E&P HSSE Directorate  
> **Current Platform Version:** v2.4.0 (Display: `v2.4.0 · Rose`)  
> **Last Updated:** 2026-10-05  

---

## 📌 Document Purpose & Maintenance Protocol

This document serves as the **single source of truth** for all platform progress, architectural decisions, completed features, system configurations, and chronological changes. 

**Rule for Future Development**:  
Every subsequent change, architectural decision, code modification, feature addition, or bug fix **must be appended to this document** under the [Changelog & Sprint History](#changelog--sprint-history) and reflected in the [Component & Feature Status Matrix](#component--feature-status-matrix).

---

## 1. Executive Summary & Problem Scope

In upstream oil & gas exploration, drilling, workover, and crude transport operations (Duliajan Rig #7, Moran GGS, Naharkatiya Well #114, Digboi Central Tank Farm, Kumchai Drilling, and offshore blocks), field crews generate hundreds of low-severity Unsafe-Act (UA), Unsafe-Condition (UC), and Near-Miss (NM) incident logs weekly.

### The Operational Challenge
High reporting volume causes severe cognitive fatigue for safety superintendents. Critical **Serious Injury & Fatality (SIF) Precursors**—such as high-pressure gas kicks, unisolated energy sources (LOTO bypasses), suspended load exposures, and toxic $H_2S$ releases—often remain obscured in unstructured, colloquial field narratives.

### The Solution
An enterprise-grade, high-density supervisory control layer combining:
1. **Domain-Specific NLP & Logic Engine**: Deterministic 0–100 risk scoring, IOGP Life-Saving Rules (LSR) classification, contextual negation handling (`without harness` vs `inspected with no tears`), and Hierarchy-of-Controls mapping.
2. **FastAPI High-Performance Backend**: RESTful microservices for real-time inference, incident lifecycle management, audit trails, and strict server-side role-based authorization.
3. **Enterprise Web Command Center (Next.js 16 + React 19 + TypeScript)**: An industrial high-density workspace adhering to OIL's brand guidelines, featuring a single scannable triage stream with inline explainability and role-gated decision modals.

---

## 2. Component & Feature Status Matrix

| Component / Subsystem | Path / Reference | Status | Description |
|---|---|---|---|
| **Deterministic Risk Engine** | `backend/app/services/rules_engine.py` | ✅ Production Ready | 0–100 scoring based on energy damage categories, probability, and severity. |
| **IOGP LSR Classifier** | `backend/app/services/rules_engine.py` | ✅ Production Ready | 9 IOGP rules mapped with keyword and contextual pattern matching. |
| **Contextual Negation Parser** | `backend/app/services/rules_engine.py` | ✅ Production Ready | Preserves negation prefixes (`without`, `unhooked`, `bypassed`, `not`) to eliminate false safety flags. |
| **Hierarchy of Controls Generator** | `backend/app/services/rules_engine.py` | ✅ Production Ready | Generates ranked Elimination, Engineering, Administrative, and PPE mitigations. |
| **FastAPI REST Backend** | `backend/app/main.py` | ✅ Production Ready | Asynchronous API exposing incident endpoints, prediction, auth, and dataset pipelines. |
| **Server-Side RBAC Enforcement** | `backend/app/routers/incidents.py` | ✅ Production Ready | Rejects non-admin confirm/override requests with `403 Forbidden` (`ADMIN` only). |
| **Dataset Deletion & Audit Log Service** | `backend/app/routers/datasets.py` | ✅ Production Ready | Role-checked `DELETE /api/datasets/{id}` writing immutable audit log before cascade delete. |
| **Two-Role Auth Architecture** | `backend/app/routers/auth.py` | ✅ Production Ready | Consolidated to strictly `ADMIN` and `USER`. Removed `SAFETY_OFFICER` and `VIEWER`. |
| **Relational Database & Seeds** | `database/schema/schema.sql` | ✅ Production Ready | PostgreSQL/Supabase schema with check constraints, foreign keys, and RLS policies for 2 roles. |
| **Backend Automated Tests** | `backend/tests/test_api.py` | ✅ Passing (43/43) | Pytest suite covering all REST endpoints, NLP engine edge cases, 403 RBAC rejections, cascade deletion regression, and rules endpoint. |
| **Executive Navigation & Clock** | `oil-hsse-app/src/components/Navigation.tsx` | ✅ Production Ready | OIL branding, basin context, live IST clock, 12h/24h toggle, inference beacon, plain role badge. |
| **Global 12h/24h Time Format Engine** | `oil-hsse-app/src/context/TimeFormatContext.tsx` | ✅ Production Ready | React Context synchronizing time format across header clock, triage list, and modals via `localStorage`. |
| **Global KPI Metric Ribbon** | `oil-hsse-app/src/components/KpiRibbon.tsx` | ✅ Production Ready | Real-time counts: Total Ingested, Flagged SIF Precursors, Pending Review, Compliance Rate with zeros/dashes. |
| **Single-List Triage Stream** | `oil-hsse-app/src/components/TriageStream.tsx` | ✅ Production Ready | Scannable stream with dynamic monospace row index numbers (`01`, `02`), inline XAI explainability. |
| **Explainability Decision Modal** | `oil-hsse-app/src/components/ExplainabilityConsole.tsx` | ✅ Production Ready | High-density dialog with XAI weights, LSR rationale, controls, collapsed narrative, and role gating. |
| **Centralized SVG Icon System** | `oil-hsse-app/src/components/ui/iconMap.tsx` | ✅ Production Ready | Single source of truth for severities, statuses, categories, and roles using `lucide-react`. Zero emojis. |
| **Universal EmptyState Component** | `oil-hsse-app/src/components/ui/EmptyState.tsx` | ✅ Production Ready | Shared zero-emoji SVG component with standard & compact modes for Dashboard, Datasets, and Analytics. |
| **Offline India Incident Heatmap** | `oil-hsse-app/src/components/IndiaIncidentMap.tsx` | ✅ Production Ready | 100% offline SVG map bundled with local TopoJSON/GeoJSON, Upper Assam coordinate lookup, pulse markers. |
| **3-Stage Batch CSV Ingestion Flow** | `oil-hsse-app/src/components/IngestionModal.tsx` | ✅ Production Ready | Staged workflow: (1) Upload dropzone, (2) Clean Quality Report + Expandable Data Review, (3) Sequential processing. |
| **Datasets & Batch Governance** | `oil-hsse-app/src/app/datasets/page.tsx` | ✅ Production Ready | Dataset inspection, OISD/DGMS audit notice, ADMIN-only cascade deletion with confirmation modal. |
| **REST API Contract Specification** | `rest/API_CONTRACT.md` | ✅ Production Ready | Comprehensive API contract documenting all endpoints, parameters, schemas, RBAC, and audit guarantees. |
| **Day / Night Mode & Theme Switch** | `oil-hsse-app/src/context/ThemeContext.tsx` | ✅ Production Ready | View Transitions API with 280ms scoped `.theme-transition` fallback, system preference sync, zero-flash `<head>` script, and animated `ThemeToggleSwitch`. |
| **Fixed & Resizable Sidebar Shell** | `oil-hsse-app/src/components/Sidebar.tsx` | ✅ Production Ready | Sticky `100dvh` viewport shell with native window scroll, zero-jank pointer capture drag handle updating `--sidebar-w` via RAF, keyboard operable. |
| **Portal-Anchored Incident Modal** | `oil-hsse-app/src/components/ExplainabilityConsole.tsx` | ✅ Production Ready | Viewport portal to `document.body`, pinned header, pinned admin action footer, internal scroll body with scroll lock and focus return. |
| **Refined Editorial Login Page** | `oil-hsse-app/src/app/login/page.tsx` | ✅ Production Ready | Left-aligned display typography, constrained line lengths (12–18 chars/line headline, 60–70 chars/line body), purged legacy badges, mounted theme switch. |
| **Centralized Version Registry** | `oil-hsse-app/src/config/version.ts` | ✅ Production Ready | Single source of truth defining `v2.5.2 · P(1x)` (`APP_VERSION = '2.5.2'`, `RELEASE_CODENAME = 'P(1x)'`), synchronizing all UI surfaces and package.json. |

---

## 3. Detailed Architectural Breakdown

### 3.1 Role Model & Access Control Architecture
- **Consolidation**: The platform strictly enforces **two user roles**:
  - **`ADMIN`**: Full supervisory authority. Able to confirm incidents (`CONFIRM & ESCALATE`), downgrade/override predictions with mandatory technical justification (`DOWNGRADE / OVERRIDE`), upload datasets, and manage pipelines.
  - **`USER`**: Read-only stakeholder access across all screens (Dashboard, Triage, Datasets, Explainability). All action buttons and decision controls are completely omitted from the UI (no disabled/ghost buttons).
- **Defense in Depth**: Client-side UI omission is backed by **server-side authorization** in FastAPI. Any request without a valid `ADMIN` credential calling `/api/v1/incidents/{id}/confirm` or `/api/v1/incidents/{id}/override` returns `403 Forbidden`.

### 3.2 Triage Stream & Explainability Workflow
- **Single-Column Full Width**: Eliminated the split-screen layout. The incident queue spans the complete container width for readability across 1080p, 1440p, and multi-monitor setups.
- **Inline Explainability**: Each incident card displays:
  - Incident ID, site code, unit/installation, and relative timestamp.
  - Severity badge (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) and 0–100 risk score.
  - Verification status (`PENDING_REVIEW`, `CONFIRMED_SIF`, `ESCALATED`, `OVERRIDDEN`).
  - Verbatim narrative preview.
  - **Dedicated Inline Explainability Banner**: Displays the matched IOGP Life-Saving Rule, top XAI keywords with importance weights (`keyword (w: 0.85)`), negation indicator pill, and click affordance.
- **Decision Modal**:
  - Opens on card click.
  - Displays complete feature importance bars, regulatory LSR context, and 4-tier Hierarchy of Controls.
  - Verbatim incident narrative is **collapsed by default** to minimize cognitive noise.
  - Contains role-gated decision actions for `ADMIN` (confirm or override with justification). Completely read-only for `USER`.

### 3.3 Centralized SVG Icon Design System
- All unicode emojis have been permanently removed from rendered UI components.
- Centralized icon mapping established in `oil-hsse-app/src/components/ui/iconMap.tsx`:
  - **Severities**: `CRITICAL` (`Flame`), `HIGH` (`AlertTriangle`), `MEDIUM` (`AlertCircle`), `LOW` (`Info`).
  - **Statuses**: `PENDING_REVIEW` (`Clock`), `CONFIRMED_SIF` (`CheckCircle2`), `ESCALATED` (`AlertOctagon`), `OVERRIDDEN` (`RotateCcw`).
  - **Roles**: `ADMIN` (`ShieldCheck`), `USER` (`UserCheck`).
  - **Categories**: Energy Damage, Work at Height, Toxic Atmosphere, Electrical, etc.

---

## 4. Changelog & Sprint History

### [v2.4.0] — 2026-09-25: Premium Motion Layer — GSAP + Inference Network Background

**Theme:** Restrained enterprise motion. Every animation is under 500ms, functional, and degrades gracefully to instant state under `prefers-reduced-motion`.

#### Dependencies added
- `gsap` — timeline-based UI animation (alongside existing `animejs`; they do not conflict)
- `three` + `@types/three` — installed but the inference layer uses a lightweight 2D Canvas renderer instead of a Three.js scene (see design decision below)

#### New files
| File | Purpose |
|---|---|
| `oil-hsse-app/src/hooks/useGsap.ts` | Five GSAP animation hooks: `useGsapModalReveal`, `useGsapRiskScoreReveal`, `useGsapPipelineStage`, `useGsapListReveal`, `useGsapKpiUpdate` |
| `oil-hsse-app/src/components/InferenceNetworkBackground.tsx` | 2D canvas ambient inference network — 28 nodes, OIL-gold accent nodes, thin connection lines, slow drift, occasional gold pulse, `pointer-events: none`, tab-visibility pause, `ResizeObserver` cleanup |

#### Modified files
| File | Change |
|---|---|
| `oil-hsse-app/src/App.tsx` | Added `InferenceNetworkBackground` behind all content in an `absolute` layer with `z-index: 0`; content wrapped in `z-index: 1` div |
| `oil-hsse-app/src/components/TriageStream.tsx` | Added `useGsapListReveal` — incident rows stagger-fade in (22ms per item, `power2.out`, runs once on mount) |
| `oil-hsse-app/src/components/ExplainabilityConsole.tsx` | Added `useGsapModalReveal` (shell + header + section stagger ≈ 320ms total); added `useGsapRiskScoreReveal` (score counts from ~65% of target to exact value in 500ms); `displayScore` state ensures React stays source of truth; `data-gsap-modal-section` on all 3 body sections |
| `oil-hsse-app/src/components/IngestionModal.tsx` | Added `useGsapPipelineStage`; replaced spinning-wheel PROCESSING step with a vertical stage list (`data-pipeline-stage`, `data-pipeline-dot`, `data-pipeline-label`); GSAP animates active/done/upcoming state on each stage index tick |
| `oil-hsse-app/src/components/KpiRibbon.tsx` | Added `useGsapKpiUpdate` to `totalIngested`, `flaggedSif`, `pendingReview` cards — animates number only on genuine value change; first render is static |

#### Design decisions / compromises
1. **Canvas over Three.js scene**: The specified effect (20–40 nodes + thin lines, slow drift) requires no 3D scene graph, camera, or WebGL — a 2D Canvas renderer is lighter, has zero bundle-size overhead from `@react-three/fiber`, and avoids the renderer/scene lifecycle complexity. Three.js is installed and available but not instantiated; the canvas approach is the correct tool for this effect.
2. **GSAP alongside animejs**: Both coexist. `useAnime.ts` handles the existing counter/pulse/HUD hooks; `useGsap.ts` handles the new timeline-based modal + pipeline animations. No duplication.
3. **Risk score display**: `displayScore` React state is used for the rendered number. GSAP animates this value from ~65% of target → exact target. `RiskBadge` still receives the real `riskScore` throughout, so risk classification display is unaffected.
4. **`prefers-reduced-motion`**: All GSAP hooks and the canvas animation check `window.matchMedia('(prefers-reduced-motion: reduce)')` before running. Canvas sets velocities to 0; GSAP hooks set values immediately and skip timelines.

#### Build verification
- `npm run build` → **✅ 0 errors, 0 TypeScript errors** — 9 routes compiled

### [v2.3.0] — 2026-09-25: Empty States, India Heatmap, Dataset Deletion with Audit Logs, Upload Revamp, Time Format Toggle, List Indexing


#### 1. Universal EmptyState Component
- Checked all major screens first before building. Created reusable zero-emoji SVG `<EmptyState />` in `oil-hsse-app/src/components/ui/EmptyState.tsx` supporting standard and compact display modes.
- **Dashboard**: When zero records exist, KPI ribbon displays zeros and dashes (`--` compliance), and triage queue renders "No incidents yet" with a primary call-to-action button directly triggering the upload modal.
- **Datasets page**: Renders "No datasets uploaded" with a primary action button to open the CSV ingestion modal.
- **Analytics page**: Individual chart panels render quiet, compact empty state cards ("Not enough data yet") rather than rendering broken or empty chart shells.

#### 2. Offline India Incident Geospatial Heatmap
- Implemented `oil-hsse-app/src/components/IndiaIncidentMap.tsx` using `react-simple-maps` with local offline TopoJSON/GeoJSON bundled into `src/data/india_states.json` (194KB) and `public/maps/india_states.json`.
- **Zero external network requests**: Guaranteed 100% offline rendering for demo resilience without dependencies on Mapbox, Leaflet, or Google Maps tiles.
- **Full National Boundary**: Shows full India map projection (`center: [82.5, 22.8]`, `scale: 1050`), highlighting operating states (Assam & Arunachal Pradesh).
- **OIL Field Coordinate Lookup Table**: Keyed by operational installations (`Duliajan`, `Moran`, `Naharkatiya`, `Digboi`, `Kumchai`, `Borbil`, `Dikom`, `Shalmari`).
- **Graceful Fallback**: Automatically falls back to Duliajan HQ coordinates for unmapped site names with a diagnostic `console.warn()`. Wrapped in `MapErrorBoundary` so geospatial failures never break other analytical components.
- **Interactive Pulse Markers**: Displays heat-scaled markers (Critical SIF red pulse, High amber, Medium yellow) and an interactive site telemetry callout showing incident volume, SIF count, and average risk score.

#### 3. Administrative Dataset Deletion with Immutable Audit Logging
- **Backend Endpoint**: Implemented `DELETE /api/datasets/{id}` in `backend/app/routers/datasets.py`.
- **Server-Side Authorization**: Rejects non-admin or unauthenticated callers with `403 Forbidden` (`ADMIN` role strictly enforced).
- **Audit-First Cascade Protocol**: Writes an immutable audit entry to `audit_logs` **before** executing cascade deletion of derived incidents, analysis, and reviews. The audit log is permanently preserved and viewable at `GET /api/datasets/audit-logs`.
- **Frontend Governance**: Delete button rendered exclusively for `ADMIN` role. Opens a safety confirmation dialog detailing cascade removal and OISD/DGMS statutory audit trail preservation. Instantly updates client KPI state and dataset list without requiring full page reload.
- **Documentation**: Synchronized and updated `rest/API_CONTRACT.md` with complete endpoint specifications, status codes, and audit guarantees.

#### 4. 3-Stage Batch CSV Ingestion Flow
- Completely restructured `IngestionModal.tsx` Batch CSV tab from a crowded single-screen into a progressive 3-stage flow:
  1. **Upload Step**: Clean drag-and-drop dropzone with "Load OIL Assam Sample CSV (10 incidents)" quick-start button.
  2. **Quality Report Step**: Comprehensive data health summary (File Name, Total Rows, Column Count, Valid Records, Duplicates, Missing Narratives, Invalid Dates, Warnings) and SIF risk pre-scan pills using standard badge hierarchy. Features an optional expandable "Review Data" drawer showing preview records.
  3. **Processing Step**: Sequential progress animation through 6 atomic states: Uploading → Validating → Cleaning → Normalizing → Analyzing → Saving with single-state progress bar feedback.
- Clean modal reset on close/reopen ensuring zero dead ends mid-flow.

#### 5. AM/PM Time Format Toggle
- Created `TimeFormatContext.tsx` providing a global `TimeFormatProvider`, `formatTimestamp`, `convertTimestampDisplay`, and `toggleTimeFormat`.
- Added an SVG clock toggle button (`24H` / `12H`) in the navigation bar Tier 2 status strip next to the live clock.
- Toggles every timestamp in the platform between 24-hour (`14:30 IST`) and 12-hour (`2:30 PM IST`) format while preserving stored IST date-times.
- Persisted user preference in `localStorage`.

#### 6. Monospace Triage List Index Numbering
- Added small ordinal index numbers (`01`, `02`, `03`...) in monospace font positioned directly to the left of each incident's severity badge.
- Reflects the active filtered and sorted queue order dynamically rather than static database IDs.

---

### [v2.2.0] — 2026-09-25: Master Architectural Refinement
#### Role Model Consolidation
- **Type System**: Updated `UserRole` in `oil-hsse-app/src/types/safety.ts`, `api.ts`, and `backend/app/models/schemas.py` to union of `'ADMIN' | 'USER'`. Removed `SAFETY_OFFICER` and `VIEWER`.
- **Backend Authorization**: Implemented `verify_admin_authorization()` in `backend/app/routers/incidents.py` checking `X-User-Role`, `Authorization`, and request body. Enforced `403 Forbidden` for unauthorized confirm/override attempts.
- **Database**: Updated `database/schema/schema.sql` and `database/seed/seed.sql` with check constraint `CHECK (role IN ('ADMIN', 'USER'))` and updated profile seeds.
- **Frontend Auth**: Simplified `AuthContext.tsx` and `LoginPage.tsx` to exactly two role selection cards without invented personas. Nav badge shows plain `Role: ADMIN` or `Role: USER`.

#### SVG Icon Standardization
- Created centralized `oil-hsse-app/src/components/ui/iconMap.tsx` mapping severities, statuses, categories, and roles to `lucide-react` SVG components.
- Refactored `badge.tsx` and `IngestionModal.tsx` to consume the icon map.
- Conducted full-codebase regex audit confirming 0 raw emoji characters in rendered UI components.

#### Triage Page Restructuring
- Converted `oil-hsse-app/src/App.tsx` from split-screen layout to full-width container for `TriageStream.tsx`.
- Integrated inline reason/explanation banner on every incident card row showing matched LSR, top XAI triggers with weights, and negation tags.
- Restructured `ExplainabilityConsole.tsx` into an accessible modal dialog with backdrop dismiss and ESC keyboard listener.
- Configured verbatim narrative to be collapsed by default.
- Implemented role-based gating in modal: full decision actions for `ADMIN`; read-only view with omitted action bar for `USER`.

#### Testing & QA
- Added test cases in `backend/tests/test_api.py` verifying 403 Forbidden on `USER` role and unauthenticated requests.
- All 38 backend pytest tests passing.
- Browser test suite executed with visual verification across login, full-width stream, and read-only/interactive modals.

---

### [v2.1.0] — 2026-09-24: Backend Integration & Database Layer
- Initialized FastAPI backend microservices (`backend/app`).
- Built deterministic rule engine in `rules_engine.py` supporting 9 IOGP rules, 6 energy categories, and syntactic negation detection.
- Developed REST endpoints:
  - `GET /api/v1/incidents` (filtering, pagination, search)
  - `POST /api/v1/incidents/predict` (real-time single log NLP evaluation)
  - `POST /api/v1/incidents/{id}/confirm` (stop-work escalation)
  - `POST /api/v1/incidents/{id}/override` (regulatory justification override)
  - `POST /api/v1/auth/login` (role profile session tokens)
  - `GET /api/v1/kpis` (aggregate HSSE risk metrics)
- Created PostgreSQL/Supabase schema with tables: `profiles`, `incidents`, `xai_triggers`, `controls`, `audit_logs`.

---

### [v2.0.0] — 2026-09-23: Industrial UI Revamp & SIF Decision Center
- Designed formal Oil India Limited industrial palette: Deep Obsidian (`#090D16`), Surface Dark (`#0E1424`), OIL Gold (`#D4AF37`), Slate (`#1E293B`).
- Built Navigation bar with real-time Indian Standard Time (IST) clock and active inference engine beacon.
- Implemented 4-card KPI ribbon for incident distribution and compliance tracking.
- Developed live log ingestion modal with real-time token extraction and scenario simulation presets (Blowout, Toxic Gas, Dropped Object).

---

## 5. Verification & Testing Commands

To verify backend correctness, run:
```bash
# Activate virtual environment
cd /Users/anshmac/Desktop/SIH\ 26/backend
source .venv/bin/activate

# Execute complete pytest suite (38 tests)
PYTHONPATH=. pytest tests/test_api.py -v

# Run FastAPI backend daemon
uvicorn app.main:app --port 8000 --host 0.0.0.0
```

To run frontend dev server:
```bash
cd /Users/anshmac/Desktop/SIH\ 26/oil-hsse-app
npm run dev
```

To test server-side 403 authorization rejection directly:
```bash
# Test USER role calling confirm -> Expect HTTP 403
curl -i -X POST "http://localhost:8000/api/v1/incidents/INC-2024-001/confirm" \
  -H "X-User-Role: USER" \
  -H "Content-Type: application/json" \
  -d '{"reviewer_id": "usr-01"}'

# Test ADMIN role calling confirm -> Expect HTTP 200
curl -i -X POST "http://localhost:8000/api/v1/incidents/INC-2024-001/confirm" \
  -H "X-User-Role: ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"reviewer_id": "adm-01"}'
```

---

## 6. Guidelines for Future Updates

Whenever making modifications, bug fixes, or enhancements:
1. **Update the Changelog**: Add an entry under Section 4 with version, date, and categorized bullet points (Features, Bug Fixes, Architecture).
2. **Update the Component Matrix**: If a new component or route is added or an existing one changes state, update Section 2.
3. **Preserve Core Architectural Constraints**:
   - Maintain the two-role model (`ADMIN` and `USER` only). Never introduce an intermediate role.
   - Use only SVG icons from `lucide-react` via `iconMap.tsx`. Never use raw emoji characters in the UI.
   - Maintain server-side authorization enforcement for all mutating endpoints.
   - Keep the triage list scannable with inline explanations and the modal for deep-dive decisioning.
4. **Version Tag**: To bump the display version, change `APP_VERSION` and/or `RELEASE_CODENAME` in `oil-hsse-app/src/config/version.ts` **only**. The string is automatically reflected in Navigation, all page footers, and this file's header.
5. **Rules Single Source of Truth**: The Guidelines tab (`/guidelines`) fetches live data from `GET /api/rules`. If any LSR keyword groups, recommendations, or negation patterns change in `backend/app/logic_engine/`, the UI updates automatically without manual copy-pasting.

---

## [v2.3.1] — 2026-09-25: Deletion Persistence Fix, Heatmap Zoom, Version Tag, AM/PM Fix, Guidelines Tab

**Platform Version:** v2.3.1 (Display: `v2.2.1 · SNOW`)  
**Test Suite:** 43 / 43 tests passing  
**Build Status:** ✅ Next.js 16 TypeScript build clean (9 routes)

---

### 0. CRITICAL BUG FIX — Deletion Persistence (Diagnosed in Prescribed Order)

**Symptom:** Deleting datasets appeared to succeed but records reappeared after hard browser refresh. `EmptyState` never showed after all deletions.

#### Diagnostic Root Cause Report (Checks 1–5):

| Check | Cause | Finding |
|---|---|---|
| **Check 1** | In-memory backend resetting on `--reload` | **CONFIRMED ROOT CAUSE #1.** `SupabaseService` had no disk persistence. Every uvicorn `--reload` (triggered by file saves) wiped all mutations. **Fix:** Added `backend/app/data/local_storage.json` file-backed persistence. Server startup now logs: `[SupabaseService] Active Backend: IN-MEMORY (Local Persistence @ ...)` — never silently ambiguous again. |
| **Check 2** | CASCADE delete / `dataset_id` linkage | **CONFIRMED ROOT CAUSE #2.** CSV normalizer (`pipeline.ts`, `normalizer.ts`) never assigned `datasetId` to incidents at ingestion time. Reducer filtered by `datasetId !== payload.datasetId` — matched zero rows, leaving orphaned incidents. **Fix:** `datasetId` now threaded through entire CSV pipeline and attached to every normalized incident. `schema.sql` foreign key changed to `ON DELETE CASCADE`. |
| **Check 3** | Supabase RLS silent block | Not applicable — currently using in-memory fallback (no live Supabase). |
| **Check 4** | Frontend demo fallback masking empty results | **CONFIRMED ROOT CAUSE #3.** `SafetyContext.loadData()` had `if (backendRes.incidents.length > 0)` guard — empty responses from the backend (after deletion) were silently dropped, leaving `MOCK_INCIDENTS` in state. **Fix:** Dispatch `SET_INCIDENTS` unconditionally with any array returned, including `[]`. `initialState.incidents` changed from `MOCK_INCIDENTS` to `[]`. `DatasetsPage` received the same fix for `datasets`. |
| **Check 5** | Client-side `localStorage` rehydration | Verified `SafetyContext` does **not** persist incidents to `localStorage`. Not a cause here. |

#### Fixes Applied:
- `backend/app/services/supabase_service.py` — file-backed disk persistence (`local_storage.json`), unambiguous startup logging, cascade delete matching both UUID and `ds-*` alias IDs, seed incident `datasetId = "ds-01"`.
- `database/schema/schema.sql` — `incidents.dataset_id` FK changed from `ON DELETE SET NULL` → `ON DELETE CASCADE`.
- `oil-hsse-app/src/lib/csv/pipeline.ts` + `normalizer.ts` — `datasetId` threaded through the entire ingestion pipeline.
- `oil-hsse-app/src/data/mockIncidents.ts` — `datasetId: 'ds-01'` mapped.
- `oil-hsse-app/src/context/SafetyContext.tsx` — `initialState.incidents = []`, empty response guard removed.
- `oil-hsse-app/src/app/datasets/page.tsx` — `datasets: []` initial state, empty response guard removed.

#### Regression Test:
- `test_delete_dataset_cascade_removes_incidents_regression` added to `backend/tests/test_api.py`.
- Test creates a dataset, ingests an incident under it, deletes the dataset, calls `GET /api/incidents`, asserts the incident list is empty.
- **Audit log integrity preserved:** verified deleted dataset's audit log entry is retained after cascade deletion.

---

### 1. HEATMAP ZOOM CONTROLS

- **File:** `oil-hsse-app/src/components/IndiaIncidentMap.tsx`
- Wrapped existing map content in `<ZoomableGroup>` from `react-simple-maps` (no new dependency).
- Added corner overlay controls: `+`, `−`, `Reset` buttons (Lucide SVG icons) and a zoom level badge (e.g., `1.0x`).
- State: `{ coordinates: [number, number], zoom: number }` clamped `minZoom={0.8}` (India boundary) and `maxZoom={4}` (prevents over-zoom).
- `onMoveEnd` callback with `undefined` guard (`pos.coordinates ?? fallback`, `pos.zoom ?? 1`) to satisfy TypeScript strict mode.
- **Zero network requests** — GeoJSON is bundled locally; no external tile fetching.
- TypeScript compile error `ZoomPanCallbackProps` resolved with explicit property destructuring.

---

### 2. VERSION TAG (SINGLE SOURCE OF TRUTH)

- **New file:** `oil-hsse-app/src/config/version.ts`
  ```ts
  export const APP_VERSION = '2.2.1';
  export const RELEASE_CODENAME = 'SNOW';
  export const FULL_VERSION_STRING = `v${APP_VERSION} · ${RELEASE_CODENAME}`;
  ```
- Imported and rendered in: `Navigation.tsx` (badge near logo), `App.tsx` footer, `analytics/page.tsx` footer, `datasets/page.tsx` footer (added this session), `guidelines/page.tsx` footer.
- **Version convention note:** Internal engineering changelog has reached `v2.3.1`. Display version `v2.2.1 · SNOW` is the public-facing release identifier — sourced from `version.ts` so bumping requires changing one file only.

---

### 3. AM/PM TOGGLE FIX (SSR HYDRATION)

- **File:** `oil-hsse-app/src/context/TimeFormatContext.tsx`
  - Added `isHydrated: boolean` state initialized to `false`.
  - `localStorage` is now read only inside `useEffect` (after mount), never during SSR render.
  - Components receive `isHydrated` flag so they can `suppressHydrationWarning` on clock elements.
- **File:** `oil-hsse-app/src/components/Navigation.tsx`
  - Replaced ambiguous single toggle button with explicit dual segmented selector: `[ 24H ] [ 12H AM/PM ]`.
  - Active state: gold text + dark background highlight. Inactive: slate. Unambiguous — labels show what format *is active*, not what it *switches to*.
  - `suppressHydrationWarning` on live IST clock span.
- **File:** `oil-hsse-app/src/components/ExplainabilityConsole.tsx`
  - Line 221: bare `{reviewedAt}` wrapped with `{formatTimestamp(reviewedAt)}` from `TimeFormatContext`.

---

### 4. GUIDELINES & RULES REFERENCE TAB

#### Backend:
- **New file:** `backend/app/routers/rules.py`
  - `GET /rules` — returns complete `lifeSavingRules` (9 IOGP LSRs), `hierarchyOfControls` (4 tiers), `negationDetection` object.
  - Data sourced **directly** from `LSR_KEYWORD_GROUPS`, `LSR_RECOMMENDATIONS`, `NEGATION_PATTERNS` — logic engine is single source of truth, no hand-maintained duplicate.
  - Mounted at both `/api/rules` and `/api/v1/rules` in `main.py`.
- **Updated:** `backend/app/main.py` — router registered under both `/api` and `/api/v1` prefixes.
- **Integration test:** `test_rules_guidelines_endpoint` in `test_api.py` verifies all 9 LSRs are present with correct fields.

#### Frontend:
- **New route:** `oil-hsse-app/src/app/guidelines/page.tsx`
  - Accessible to both `ADMIN` and `USER` (no role-gating — informational only).
  - Fetches live data via `apiClient.getRules()`. Displays built-in verified fallback if backend is unreachable.
  - **Section 1:** 9 IOGP Life-Saving Rules — each card shows: `LSR-XX` code badge, Lucide icon, category tag, base risk score, plain-language description, statutory reference, key trigger signals, and 4-item remediation framework (Elimination → Engineering → Administrative → PPE).
  - **Section 2:** 4-Tier Hierarchy of Controls — color-coded by tier (Emerald/Blue/Amber/Rose), with OIL E&P implementation note.
  - **Section 3:** Negation-Aware Detection Architecture — plain-language explainer, amber-highlighted active negation tokens, emerald-highlighted benign filter tokens, design principle.
  - Searchable + filterable by LSR category (Search input + dropdown).
  - Tab switcher: All / IOGP LSRs / Hierarchy / Negation views.
  - Matches platform design system — dark industrial palette, Lucide icons, OIL Gold highlights.
- **Navigation:** `Guidelines` tab with `BookOpen` icon added to `Navigation.tsx` — visible to both roles.
- **API client:** `apiClient.getRules()` added to `oil-hsse-app/src/lib/api/client.ts`.

---

### 5. QA VERIFICATION SUMMARY

| Item | Status | Notes |
|---|---|---|
| TypeScript build | ✅ PASS | `npm run build` exits 0. 9 routes including `/guidelines`. |
| Backend test suite | ✅ 43/43 PASS | Including new cascade regression test and rules endpoint test. |
| Deletion persistence | ✅ Verified (code) | Check 1+2+4 all fixed. File-backed persistence + `datasetId` propagation + empty response guard removed. |
| Heatmap zoom controls | ✅ Build verified | `ZoomableGroup` wrapped, `onMoveEnd` TS error fixed with `?? fallback`. |
| Version tag | ✅ Build verified | `FULL_VERSION_STRING` renders in all 4 footers + nav badge. |
| AM/PM toggle (hydration) | ✅ Build verified | `isHydrated` guard in context, segmented `24H / 12H` selector in nav. |
| Guidelines tab `/guidelines` | ✅ Build verified | Route compiled. Live fetch + built-in fallback. Both roles accessible. |
| Browser QA (visual) | ⚠️ Rate-limited | Browser subagent hit API rate limit. Visual verification deferred — platform is running at `http://localhost:3000`. |

---

### [v2.5.0] — 2026-09-25: Mobile Optimization, Team Rebrand, Demo Data Cleanup, Login Version, Guidelines Accordion & Escalation Likelihood

**Theme:** Comprehensive field-readiness pass. Full functional parity for mobile users, honest rule-based escalation indicators, complete elimination of auto-loaded demo data, and team rebrand to **THΞ ΛRPΛNΞT**.

#### 1. Mobile Optimization & Responsive Strategy
- **Navigation (`Navigation.tsx`)**:
  - Implemented responsive mobile drawer toggled via an accessible hamburger button (`min-w-[44px] min-h-[44px]`).
  - Tier 2 supervisory status strip collapses below `md` breakpoint to display only essential telemetry (live clock + user role badge), preventing awkward wrapping in field conditions.
- **KPI Ribbon (`KpiRibbon.tsx`)**:
  - Responsive grid layout (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) ensuring clean vertical or 2x2 stacking rather than squeezing metrics into an unreadable horizontal row.
- **Triage Stream (`TriageStream.tsx`)**:
  - Maintained full operational parity (admin can confirm, escalate, or override from field mobile devices).
  - Inline explanation banner features an adaptive mobile layout: shows the primary trigger keyword with a `+N more` pill indicator on narrow screens, preventing excessively tall unreadable rows while keeping full details in the modal.
- **Explainability Console (`ExplainabilityConsole.tsx`)**:
  - Modal adapts to a full-screen sheet on mobile (`fixed inset-0 p-0 sm:p-4`, `w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[92vh] rounded-none sm:rounded-2xl`).
  - Touch targets across all interactive buttons (close button, confirm & escalate, downgrade/override, narrative expander) upgraded to at least 44px min-height/width (`min-h-[44px]`).
- **Ambient Inference Background (`InferenceNetworkBackground.tsx`)**:
  - Detects mobile and touch-primary devices (`< 768px` or `pointer: coarse` / `maxTouchPoints > 0`) and skips mounting/rendering entirely, preserving mobile GPU performance and field battery life.
- **India Incident Map (`IndiaIncidentMap.tsx`)**:
  - Enlarged zoom control buttons (`+`, `-`, `Reset`) and cluster popup close buttons to `>= 44px` touch targets.

#### 2. Team Rebrand — "THΞ ΛRPΛNΞT"
- Updated all references across UI footers, header badges, layout metadata, and documentation to **`THΞ ΛRPΛNΞT`** (e.g. `SIH26165 · THΞ ΛRPΛNΞT`).
- Verified that the stylized Unicode characters (Ξ, Λ) are strictly used for display/UI strings and never leak into database keys, variable names, URLs, or test fixtures. Zero remaining occurrences of the previous team name.

#### 3. Demo Data Cleanup — Manual Load Only
- Removed `_init_seed_data()` startup auto-seeding in `backend/app/services/supabase_service.py`.
- Reset `backend/app/data/local_storage.json` to a completely clean initial state `{ "datasets": {}, "incidents": {}, "audit_logs": [] }`.
- Removed `MOCK_INCIDENTS` fallback in `SafetyContext.tsx` and unused `DEMO_DATASETS` constant in `datasets/page.tsx`.
- The only mechanism for loading demo data is now the explicit "Load Sample OIL Assam CSV" button in the manual ingestion dialog.
- Fresh database starts display genuine `EmptyState` components across Dashboard, Datasets, and Analytics.

#### 4. Version Display on Login Page
- Integrated `FULL_VERSION_STRING` from `src/config/version.ts` into the footer of `oil-hsse-app/src/app/login/page.tsx`.
- Matches the version badge format displayed across the rest of the application.

#### 5. Guidelines Page — Accordion Layout (`guidelines/page.tsx`)
- Converted the 9 IOGP Life-Saving Rules from always-expanded cards into a collapsed-by-default accordion layout.
- Each item shows rule code, icon, category, and single-line summary when collapsed.
- Tapping expands the rule in place to reveal full details (description, trigger phrases, hierarchy of controls remediation).
- Supports multi-section expansion simultaneously for side-by-side comparison.
- Added global "Expand All" and "Collapse All" toggle controls.
- Content is dynamically sourced from the backend `GET /api/rules` endpoint.

#### 6. Escalation Likelihood Indicator
- Implemented an honest, deterministic, rule-based **Escalation Likelihood Indicator** (strictly avoiding the term "probability" to adhere to project integrity standards).
- **Backend Evaluator**: `backend/app/logic_engine/escalation_evaluator.py` computes an explainable 0–100 score and qualitative tier (`LOW`, `MODERATE`, `HIGH`, `SEVERE`) based on:
  1. High-energy hazard modifier volume.
  2. Repeat site/LSR recurring hazard signals.
  3. Time elapsed without review on critical incidents.
  4. Proximity to next severity tier threshold (e.g., 78/100 near CRITICAL cutoff).
  5. Compounding barrier negation clauses.
- **Frontend Evaluator & UI**: `oil-hsse-app/src/lib/logic-engine/escalation-evaluator.ts` and `oil-hsse-app/src/components/EscalationLikelihoodGauge.tsx`.
- Integrated as a compact pill on triage stream cards and an explainable breakdown card inside the `ExplainabilityConsole`.
---

### [v2.4.0] — 2026-10-05: Root-Cause Persistence Fix, Upload-First Log Report, Version Bump "Rose", Dataset Details Panel Seam Fix

**Theme:** Production-grade persistence integrity across Supabase & disk fallbacks, upload-first batch ingestion ergonomics, centralized version bump to `v2.4.0 · Rose`, and resolution of the Dataset Details panel layout border artifact.

#### 1. Root-Cause Persistence Fix
- **Diagnosis of Prior Bug**:
  - `datasets.id` in PostgreSQL master schema (`database/schema/schema.sql`) is defined as `uuid`, whereas client CSV pipelines were generating string identifiers (e.g. `ds-1727...`), causing PostgreSQL to reject inserts with UUID syntax errors.
  - In `backend/app/services/supabase_service.py`, `list_incidents()` and `list_datasets()` evaluated `if response.data and len(response.data) > 0:` which caused queries returning 0 rows (e.g., when a user deleted all datasets/incidents) to fall through to in-memory/disk store, resurrecting deleted items upon page refresh.
- **Implementation**:
  - Added deterministic RFC4122 UUID sanitizer `SupabaseService._ensure_uuid(val)` guaranteeing compatibility with PostgreSQL's `uuid` type.
  - Refactored `list_incidents()` and `list_datasets()` to check `if response.data is not None:`, preventing empty tables from falling through to stale in-memory data.
  - Added unambiguous startup banner logging in `SupabaseService.__init__` explicitly printing whether `SUPABASE` (live cloud) or `IN-MEMORY` (local storage) is active.
  - Updated `/api/health` and `/api/v1/health` to expose `activeBackend: "supabase" | "in-memory"`.
  - Added `.env.example` and configured `.env` templates for both `backend/.env` and `oil-hsse-app/.env.local`.

#### 2. "Log Report" Button → Upload-First Experience
- **Ingestion Modal (`IngestionModal.tsx`)**:
  - Default tab flipped to **Upload CSV / Batch Ingestion (Primary)** (`activeTab = 'csv'`).
  - Single Log manual entry demoted from equal visual weight to a secondary switcher button (`Manual Entry`).
  - Added contextual prompt link: *"Need to log a one-off field observation? Log a single entry manually instead →"*.
  - Added *"Return to Batch CSV Upload"* link when in manual single-entry mode.

#### 3. Version Bump — v2.4.0 · Rose
- Updated single source of truth in `oil-hsse-app/src/config/version.ts`:
  - `APP_VERSION = '2.4.0'`
  - `RELEASE_CODENAME = 'Rose'`
  - `FULL_VERSION_STRING = 'v2.4.0 · Rose'`
- Synchronized `backend/app/config.py` with `APP_VERSION = "2.4.0"`.
- Verified consistent display across Top Navigation, Application Footers, and Login Screen.

#### 4. "Dataset Details" Panel — Layout Seam Fix
- **Root Cause**:
  - In `oil-hsse-app/src/components/ui/EmptyState.tsx`, the `compact` mode utilized `h-full min-h-[160px]`. In a parent container with `p-4 space-y-4` and an `h2` header, `height: 100%` forced the child element past the bottom boundary. Because the parent card lacked `overflow-hidden`, the inner dashed border bled through, producing a visual seam/deformation at the bottom edge.
- **Resolution**:
  - Updated `EmptyState.tsx` compact mode to `w-full min-h-[160px] flex-1 flex flex-col items-center justify-center`.
  - Added `overflow-hidden` and `items-start` alignment in `datasets/page.tsx` on the parent card and grid container, guaranteeing clean, clipped rounded borders in both empty and populated states.

---

### [v2.4.1] — 2026-10-05: Real Supabase Project Connection & Complete In-Memory Fallback Removal

**Theme:** Full migration to live Supabase cloud persistence (`xwacvnrifynictgtkixm.supabase.co`), complete removal of silent in-memory fallback, and automated lifecycle verification (upload, refresh, delete, restart, audit log).

#### 1. Real Supabase Project Integration
- **Project Ref**: `xwacvnrifynictgtkixm` (`https://xwacvnrifynictgtkixm.supabase.co`).
- **Keys Configured**:
  - `SUPABASE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `sb_publishable_1Unq6jf27q_vOGlU3_et-g_fd0q1sCG`
  - `SUPABASE_SERVICE_ROLE_KEY`: Service role secret key configured in local `backend/.env` (strictly gitignored).
- **Environment Protection**:
  - Verified `.env` and `.env.*` are ignored across root `.gitignore`, `backend/.gitignore`, and `oil-hsse-app/.gitignore`. Only clean `.env.example` templates remain tracked in Git.

#### 2. DDL Schema & Two-Role Permission Model
- **Master Schema Executed**: Applied `database/schema/schema.sql` against the fresh Supabase database.
- **Tables Verified**:
  1. `public.profiles`: User identities with two-role check (`role IN ('ADMIN', 'USER')`).
  2. `public.datasets`: Raw batch CSV metadata, validation rates, and lifecycle status.
  3. `public.incidents`: Normalized field observation records across Assam Basin installations.
  4. `public.incident_analysis`: Deterministic 0–100 risk score, XAI triggers, negation clauses, and LSR mapping.
  5. `public.incident_reviews`: Human-in-the-loop supervisory decisions (Confirm/Override).
  6. `public.audit_logs`: Immutable regulatory compliance trail fulfilling OISD-105 & DGMS.
  7. `public.processing_jobs`: Async batch queue status.
- **Row Level Security (RLS)**:
  - Enabled across all 7 tables matching the two-role model: `ADMIN` full CRUD control, `USER` read-only.
- **Seed Policy**:
  - Zero auto-seeding of demo data. Database starts genuinely empty per design specification.

#### 3. Complete Removal of Silent In-Memory Fallback
- **FastAPI Backend (`backend/app/services/supabase_service.py`)**:
  - Removed all silent fallbacks to in-memory store in `list_incidents`, `get_incident`, `create_incident`, `confirm_incident`, `override_incident`, `save_pipeline_result`, `list_datasets`, `delete_dataset`, and `get_audit_logs`.
  - Startup check: Fails loudly with `RuntimeError` if Supabase URL or keys are missing and `USE_IN_MEMORY_DB` is not explicitly set to `true`.
  - In-memory mode is now strictly gated behind `USE_IN_MEMORY_DB=true` for isolated offline test suites only (`backend/tests/conftest.py`).
  - Active backend is explicitly reported in startup logs and `/api/health`: `activeBackend: "supabase"`.

#### 4. End-to-End Verification (`scripts/test_persistence_lifecycle.py`)
- **CHECK 1 (Startup Mode)**: Confirmed backend reports `activeBackend: "supabase"` and `supabaseConfigured: true`.
- **CHECK 2 (Data Upload)**: Uploaded `test_upload_demo_incidents.csv` (10 rows). Verified that rows are inserted directly into remote Supabase tables: `datasets`, `incidents`, and `incident_analysis`.
- **CHECK 3 (Process Restart Persistence)**:
  - Killed backend server process entirely.
  - Spawned fresh backend instance.
  - Queried `GET /api/v1/datasets` and `GET /api/v1/incidents`.
  - Confirmed all dataset and incident data from before the restart is 100% present in the fresh instance directly from Supabase.
- **CHECK 4 (Cascade Deletion & Audit Trail)**:
  - Executed `DELETE /api/v1/datasets/{id}` via API with `X-User-Role: ADMIN`.
  - Confirmed dataset and all 10 derived incidents were cascade deleted in Supabase.
  - Verified immutable deletion record written to Supabase `audit_logs` table (`action='DATASET_DELETED'`).

---

### Sprint v2.4.1 — Post-Upload Performance, Supabase Persistence Verification, Universal Skeletons, Real Auth & Demo Bypass
**Completed:** 2026-10-05

#### 1. Post-Upload Lag Root-Cause Analysis & Fixes
- **Entrance-Animation Storm Fixed**: Profiling confirmed `useGsapListReveal` was querying every single row in the DOM and scheduling a separate GSAP tween with stagger timing. On 50–500+ incident uploads, this locked the main thread. Capped GSAP reveal animation in `oil-hsse-app/src/hooks/useGsap.ts` to the first 4 visible cards on bulk loads, rendering all remaining items in their final visual state immediately (`opacity: 1, transform: none`). Added dedicated `useGsapNewItemReveal` for single manual entries.
- **List Virtualization Integrated**: Installed `@tanstack/react-virtual` in `oil-hsse-app`. Refactored `TriageStream.tsx` with `useWindowVirtualizer` (active for >25 items), memoized `IncidentCard`, and pre-computed risk badge & escalation metrics to eliminate redundant renders while maintaining smooth 60fps scrolling.
- **Batched State Ingestion**: Resolved triple re-render cascade in `IngestionModal.tsx` by introducing `COMMIT_DATASET_INGESTION` in `SafetyContext.tsx`. Incidents, dataset metadata, and active filters are now committed atomically in one state dispatch.

#### 2. Real Supabase Database Connection & Persistence Checklist
- Confirmed project `xwacvnrifynictgtkixm` (`https://xwacvnrifynictgtkixm.supabase.co`) is live with `SERVICE_ROLE_KEY ACTIVE`.
- Confirmed all 7 core tables exist and are active: `profiles`, `datasets`, `incidents`, `incident_analysis`, `incident_reviews`, `audit_logs`, `processing_jobs`.
- Confirmed RLS policies are enabled across all tables, matching the two-role model (`ADMIN` full access, `USER` read-only).
- Confirmed in-memory fallback is disabled by default (`USE_IN_MEMORY_DB=false`) and only allowed for offline unit tests.
- Confirmed full lifecycle persistence: Uploaded dataset, verified count, killed backend server, restarted server, confirmed data survived restart, executed cascade deletion, and verified immutable entry in `audit_logs`.

#### 3. Universal Shaped Skeleton Loaders & Action Spinners
- Built shared suite `oil-hsse-app/src/components/ui/Skeleton.tsx`:
  - `Skeleton`: Geometric placeholder with subtle pulse, respecting `prefers-reduced-motion` (`motion-reduce:animate-none`). Designed to blend with `#090D16` and avoid visual competition with the green `INFERENCE ACTIVE` beacon.
  - `ButtonSpinner`: Lightweight SVG spinner for action states ("Deleting...", "Sign In...").
  - `TriageStreamSkeleton`: Replicates priority filter row, search bar, and 4 incident card placeholders with tag blocks.
  - `KpiRibbonSkeleton`: Replicates the 4-card telemetry ribbon.
  - `DatasetsSkeleton`: Replicates 4 summary cards, table headers, and rows.
  - `AnalyticsSkeleton`: Replicates telemetries, velocity chart, donut chart, and bar charts.
- Wired loading states into `SafetyContext` (`isLoading`), `TriageStream`, `KpiRibbon`, `datasets/page.tsx`, and `analytics/page.tsx`.

#### 4. Real Supabase Authentication & Instant Demo Bypass
- **Strict Role-Default Invariant**: Integrated Supabase Auth (`signUpWithEmail` and `loginWithEmail`). All self-service registrations are **strictly provisioned with `USER` role** (Field Observer). Administrative privileges cannot be requested via self-service and require explicit database/dashboard promotion.
- **Profiles Sync**: User roles, names, and basin metadata are stored on `public.profiles` keyed to the Supabase Auth user ID.
- **Dual-Flow Interface (`oil-hsse-app/src/app/login/page.tsx`)**:
  - **Primary Flow**: Tabbed card ("Sign In" vs "Create Account") with field validation (email syntax, minimum 6 characters, confirmation matching), password visibility toggle, `ButtonSpinner` submit feedback, and clean, styled dark error banners with icons.
  - **Secondary Flow**: Clearly separated evaluation section below ("Or Continue with a Demo Account (Instant Hackathon Evaluation)") with one-click cards for Chief HSSE Superintendent (ADMIN) and HSSE Field Observer (USER).
- Preserved all RBAC gating: `USER` remains strictly read-only; `ADMIN` retains exclusive stop-work escalation, override, and dataset management authority.

#### 5. End-to-End Quality Assurance & Build Verification
- `npm run build` in `oil-hsse-app`: 10/10 routes compiled statically in 2.1s with zero TypeScript errors.
- `pytest backend/tests/test_api.py`: 22/22 backend test suites passed (100%).
- Full browser verification: Recorded sessions demonstrating auth form validation, demo bypass login, zero-jank triage list scrolling, and dataset deletion with audit verification.

---

### [v2.5.2 · P(1x)] — 2026-10-19: Theme Switch Polish, Resizable Fixed Sidebar, Incident Modal Upward Overflow Fix, Login Page Cleanup, Single-Source Version Bump

**Theme:** Industrial-grade Polish, Fluid Ergonomics, Zero-Jank UI Architecture.

#### 1. Day / Night Mode — Proper Optimization & Smooth Switch
- **Semantic Tokenization**: Replaced all remaining raw dark hexes (`#090D16`, `#1E293B`, `#0E1424`, `#11182A`) and conflicting gold text across `IngestionModal.tsx`, `IndiaIncidentMap.tsx`, `Skeleton.tsx`, and `EmptyState.tsx` with semantic design tokens (`bg-app-surface`, `bg-app-elevated`, `border-app-subtle`, `text-app-primary`, `text-app-secondary`, `text-app-muted`).
- **Zero Flash on Load**: Installed synchronous inline script in `<head>` (`layout.tsx`) that reads `localStorage.theme` or system OS `prefers-color-scheme` and sets `data-theme` + `color-scheme` on `<html>` before first paint, with `suppressHydrationWarning`.
- **Smooth Switch Architecture**: Implemented `document.startViewTransition()` feature-detection in `ThemeContext.tsx`, falling back to scoped `.theme-transition` class on `<html>` for 280ms affecting only `background-color, color, border-color, fill, stroke`. Instant switch under `prefers-reduced-motion: reduce`.
- **Accessible Animated Switch**: Built `ThemeToggleSwitch.tsx` (`role="switch"`, `aria-checked`, keyboard operable via Space/Enter, sliding thumb, cross-fading Sun/Moon SVG icons).

#### 2. Fixed & Resizable Desktop Sidebar
- **Sticky Viewport Shell**: Desktop sidebar converted to `position: sticky; top: 0; height: 100dvh` while document window scrolls natively. Replaced all `overflow-x: hidden` ancestors with `overflow-x: clip` to preserve sticky positioning. Nav list scrolls internally (`overflow-y: auto`).
- **Zero-Jank Pointer Capture Drag Handle**: Right-edge resizer with `setPointerCapture` updating `--sidebar-w` directly on `document.documentElement` inside `requestAnimationFrame` (0 React re-renders during active drag). Clamped between 200px and 360px, snap-to-rail (68px) when dragged below 140px, double-click resets to default 256px.
- **Full Keyboard Accessibility**: `role="separator"`, `aria-orientation="vertical"`, `aria-valuenow`, resizable via Left/Right arrow keys (Shift for larger steps). Tooltips rendered on collapsed rail items.
- **Persistence**: Sidebar width stored in `localStorage` and initialized via inline script in `<head>` to avoid layout shift.

#### 3. Incident Modal Upward Overflow Fix
- **Direct Body Portal**: Rendered `ExplainabilityConsole.tsx` via `createPortal(..., document.body)` with `fixed inset-0 z-[100]` to avoid parent scroll containers or transform context traps.
- **Flex Column Architecture**: Modal panel sized to `max-h-[100dvh] sm:max-h-[88dvh]`, header fixed at top, admin action bar (`CONFIRM & ESCALATE` / `OVERRIDE`) pinned at bottom (`flex-shrink-0`), and modal body set to `flex-1 min-h-0 overflow-y-auto overscroll-contain`.
- **Scroll Lock & Focus Return**: Background scroll locked on open with scrollbar width compensation (`paddingRight`). Focus trapped inside modal and returned to clicked trigger row on close.

#### 4. Login Page Polish & Clean-up
- **Left-Aligned Hero Composition**: Transformed hero section to `items-start text-left`, constraining display headline to 12–18 characters per line (`max-w-[15ch] sm:max-w-[18ch]`) and body copy to 60–70 characters per line (`max-w-[65ch]`). Left-aligned action buttons and category pill.
- **String Purge**: Removed `"NAVRATNA"` badge and `"अंतः अस्ति प्रारंभ"` motto from `/login` while leaving other pages unaffected.
- **Clean Theme Switch**: Mounted `<ThemeToggleSwitch size="sm" />` in top navigation bar.

#### 5. Version Bump to v2.5.2 · P(1x)
- Single source of truth in `src/config/version.ts`:
  - `APP_VERSION = '2.5.2'`
  - `RELEASE_CODENAME = 'P(1x)'`
  - `FULL_VERSION_STRING = 'v2.5.2 · P(1x)'`
- `package.json` updated to valid semver `"2.5.2"`. All pages, sidebar, and headers synchronized.

---

### [v2.5.3] — 2026-10-20: Login Experience Rebuild — Spotlight Hero & Apple-Inspired Auth Architecture

**Theme:** Pure Industrial Editorial Elegance, Aceternity Spotlight Compositor Layer, Zero-Dead-Link Authentication Architecture.

#### 1. Zero Legacy Design Language Purge
- Deleted `src/components/ui/typewriter-effect.tsx` and legacy dark dialog from the bundle.
- Completely removed role-selection cards, top pill row ("SIH26165 · ... / DECISION-SUPPORT SYSTEM"), "INFERENCE ACTIVE" beacon, and uppercase letter-spaced micro-labels.
- Hardcoded hex colors and dark-only classes purged in favor of theme tokens (`#0066CC` light / `#2997FF` dark, hairline borders, 18px radii).
- Maintained strict absence of `"NAVRATNA"` badge and `"अंतः अस्ति प्रारंभ"` on `/login`.

#### 2. Theme-Tuned Spotlight Primitive (`src/components/ui/spotlight-new.tsx`)
- Adapted Aceternity UI Spotlight into pure CSS compositor architecture with zero JS animation loops.
- Powered by theme variables `--spot-1`, `--spot-2`, `--spot-3` (Apple Blue at 4–10% alpha in light; Sky Blue at 4–8% in dark).
- Placed on lowest layer (`z-0`, `pointer-events-none`, `aria-hidden="true"`), hero container isolated with `overflow-hidden isolate`.
- Mobile attenuation: scales with `clamp()`, suppresses secondary beams on `< 768px` viewports, and attenuates opacity to prevent washout.
- Pure compositor `@keyframes` sway (`spotlight-left`, `spotlight-right`, 7s ease-in-out alternate) disabled under `prefers-reduced-motion: reduce`.

#### 3. Minimal Editorial Hero & Three Plain Facts
- Left-aligned display headline: **"See the signals before they become incidents."** (solid text, weight 600, tight tracking, 14–16ch per line, clamp display scale).
- Supporting copy: 17–18px muted text, 60–65 chars per line.
- Left-aligned action row: Apple Blue primary pill **Sign in** and outlined secondary pill **Create account**.
- Three plain facts below hairline (no cards, separated by whitespace):
  1. *Every flag is explained.*
  2. *Mapped to IOGP Life-Saving Rules.*
  3. *People make the decisions.*
- Single quiet line footer with computed year, client attribution, version constant, and functional support mailto link.

#### 4. Accessible AuthDialog & Standalone AuthForm
- Standalone `AuthForm.tsx`:
  - Segmented control with CSS transform-sliding indicator for Sign in / Create account.
  - Visible labels, 44px touch targets, 2px Apple Blue focus rings, standard placeholders, show/hide password with aria labels.
  - Validation on blur and submit; technical errors mapped to clear human notices; zero raw error strings.
  - Policy notice: "New accounts start with User access. An administrator can grant more."
  - Deep-linkable `/login` (Sign in), `/login?mode=signup` (Create account), `/signup` redirect route, and dismiss back to plain hero.
- Shared `Dialog.tsx` primitive:
  - Portal to `document.body`, `max-height: min(90dvh, 440px)`, focus trap and return, scrollbar-compensated scroll lock, ESC dismiss.
- Server-authenticated demo access:
  - Gated by `NEXT_PUBLIC_ENABLE_DEMO_MODE=true`.
  - Credentials held in server environment variables via `POST /api/auth/demo`.
  - Real sessions created with roles read directly from database `profiles`. Zero client-side role assignment.





