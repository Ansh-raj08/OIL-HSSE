# OIL HSSE Enterprise Decision-Support Platform — Database Architecture

This directory contains the database design and migrations for the **OIL HSSE SIF-Precursor Platform (SIH26165)**, designed in accordance with Section 27 and 28 of the Master Engineering Specification.

---

## 🏗️ Architecture: Separation of Concerns

The database design strictly isolates 5 operational stages:

1. **Raw Source Data** (`datasets`): Tracks raw CSV uploads, file metadata, byte size, processing stages, and quality error counts.
2. **Normalized Safety Incidents** (`incidents`): Canonical representation of field logs across Assam Basin installations with validation status.
3. **AI / Logic Engine Inference** (`incident_analysis`): Stores deterministic 0–100 risk score, risk level, SIF precursor flag, detected Life-Saving Rule (LSR), Explainable AI (XAI) triggers with negation awareness, and Hierarchy of Controls.
4. **Human-in-the-Loop Validation** (`incident_reviews`): Formal review records capturing who confirmed/escalated or overrode an AI flag, with regulatory justification notes.
5. **Immutable Regulatory Audit Trail** (`audit_logs`): OISD-105 & DGMS compliant audit trail automatically generated via database triggers for all human decisions.

---

## 📁 Directory Structure

```text
database/
├── schema/
│   └── schema.sql             # Complete PostgreSQL / Supabase DDL with RLS & Triggers
├── migrations/
│   └── 001_initial_schema.sql # Versioned initial migration script
├── seed/
│   └── seed.sql               # Seed data: Default profiles, sample dataset, initial incidents
└── README.md                  # This documentation
```

---

## 🚀 How to Apply to Supabase

### Option 1: Supabase Web Dashboard (SQL Editor)
1. Open your Supabase Project Dashboard.
2. Navigate to the **SQL Editor**.
3. Copy the contents of [`schema/schema.sql`](./schema/schema.sql) and execute.
4. Copy the contents of [`seed/seed.sql`](./seed/seed.sql) and execute.

### Option 2: Supabase CLI
```bash
# Initialize Supabase if not already done
npx supabase init

# Link to your remote project
npx supabase link --project-ref <your-project-id>

# Run migrations
npx supabase db push
```

---

## 🔒 Row-Level Security (RLS) Policies
- `profiles`: Users can read profile details; only administrators can update roles.
- `datasets`: All authenticated users can inspect datasets; upload/deletion restricted to `ADMIN`.
- `incidents` & `incident_analysis`: Read access granted to all roles; update permissions gated for review workflows.
- `incident_reviews`: Insert restricted to `ADMIN`.
- `audit_logs`: Read-only access for compliance audit; inserts handled automatically by PostgreSQL triggers.
