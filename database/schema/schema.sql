-- ============================================================
-- OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
-- Supabase / PostgreSQL Master DDL Schema (SIH26165)
-- Section 27 & 28: Separation of Raw, Processed, Analysis, Reviews, & Audits
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- 1. USER PROFILES & ROLES
-- ------------------------------------------------------------
create table if not exists public.profiles (
    id uuid primary key default gen_random_uuid(),
    email text unique not null,
    full_name text not null,
    role text not null check (role in ('ADMIN', 'USER')),
    basin text default 'Assam Operational Basin',
    designation text,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

comment on table public.profiles is 'Application user identities and role-based permissions.';

-- ------------------------------------------------------------
-- 2. RAW SOURCE DATASETS (CSV Ingestion Metadata)
-- ------------------------------------------------------------
create table if not exists public.datasets (
    id uuid primary key default gen_random_uuid(),
    filename text not null,
    original_filename text not null,
    storage_path text,
    file_size_bytes bigint default 0,
    row_count integer default 0,
    valid_row_count integer default 0,
    invalid_row_count integer default 0,
    warning_row_count integer default 0,
    status text not null default 'UPLOADING' check (
        status in ('UPLOADING', 'VALIDATING', 'CLEANING', 'ANALYZING', 'READY', 'ERROR')
    ),
    uploaded_by uuid references public.profiles(id) on delete set null,
    error_message text,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

comment on table public.datasets is 'Uploaded CSV batch files and cleaning lifecycle status.';

-- ------------------------------------------------------------
-- 3. NORMALIZED SAFETY INCIDENTS (Field Observation Records)
-- ------------------------------------------------------------
create table if not exists public.incidents (
    id text primary key, -- e.g. 'OIL-2026-1043'
    dataset_id uuid references public.datasets(id) on delete cascade,
    site text not null,
    basin text not null default 'Assam Operational Basin',
    reported_by text not null,
    category text not null check (category in ('UNSAFE_ACT', 'UNSAFE_CONDITION', 'NEAR_MISS')),
    timestamp text not null,
    raw_narrative text not null,
    cleaned_narrative text,
    truncated_narrative text,
    validation_status text not null default 'PENDING' check (
        validation_status in ('PENDING', 'CONFIRMED', 'OVERRIDDEN')
    ),
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

comment on table public.incidents is 'Canonical safety reports ingested from field logs or CSV files.';

-- ------------------------------------------------------------
-- 4. INCIDENT ANALYSIS & XAI (SIF & Risk Inference Engine)
-- ------------------------------------------------------------
create table if not exists public.incident_analysis (
    incident_id text primary key references public.incidents(id) on delete cascade,
    risk_score integer not null check (risk_score between 0 and 100),
    risk_level text not null check (risk_level in ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    is_sif_precursor boolean not null default false,
    lsr_code text,
    lsr_title text,
    lsr_category text,
    lsr_violations jsonb default '[]'::jsonb not null,
    xai_triggers jsonb default '[]'::jsonb not null,
    hierarchy_actions jsonb default '[]'::jsonb not null,
    analysis_version text not null default 'v2.0-deterministic',
    analyzed_at timestamptz default timezone('utc'::text, now()) not null
);

comment on table public.incident_analysis is 'Inference output: deterministic 0-100 risk score, XAI triggers, negation detection, and LSR mapping.';

-- ------------------------------------------------------------
-- 5. HUMAN-IN-THE-LOOP VALIDATION & ESCALATIONS
-- ------------------------------------------------------------
create table if not exists public.incident_reviews (
    id uuid primary key default gen_random_uuid(),
    incident_id text not null references public.incidents(id) on delete cascade,
    reviewer_id uuid references public.profiles(id) on delete set null,
    reviewer_name text not null,
    action text not null check (action in ('CONFIRM', 'OVERRIDE')),
    previous_status text not null,
    new_status text not null,
    justification text,
    escalation_notes text,
    reviewed_at timestamptz default timezone('utc'::text, now()) not null
);

comment on table public.incident_reviews is 'Supervisory human-in-the-loop decisions: Confirm & Escalate or Technical Justification Override.';

-- ------------------------------------------------------------
-- 6. AUDIT LOGS (Compliance & Legal Traceability)
-- ------------------------------------------------------------
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    entity_type text not null check (entity_type in ('incident', 'dataset', 'review', 'user')),
    entity_id text not null,
    action text not null,
    actor_id uuid references public.profiles(id) on delete set null,
    actor_name text not null,
    details jsonb default '{}'::jsonb not null,
    ip_address text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

comment on table public.audit_logs is 'Immutable regulatory audit log fulfilling OISD-105 and DGMS compliance requirements.';

-- ------------------------------------------------------------
-- 7. PROCESSING JOBS (Async Batch Queue)
-- ------------------------------------------------------------
create table if not exists public.processing_jobs (
    id uuid primary key default gen_random_uuid(),
    dataset_id uuid not null references public.datasets(id) on delete cascade,
    status text not null default 'QUEUED' check (status in ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED')),
    progress_pct integer not null default 0 check (progress_pct between 0 and 100),
    stage text,
    processed_count integer not null default 0,
    total_count integer not null default 0,
    error_message text,
    started_at timestamptz default timezone('utc'::text, now()) not null,
    completed_at timestamptz
);

comment on table public.processing_jobs is 'Batch asynchronous CSV ingestion pipeline execution tracker.';

-- ------------------------------------------------------------
-- 8. PERFORMANCE INDEXES
-- ------------------------------------------------------------
create index if not exists idx_incidents_validation_status on public.incidents(validation_status);
create index if not exists idx_incidents_site on public.incidents(site);
create index if not exists idx_incidents_category on public.incidents(category);
create index if not exists idx_incidents_dataset_id on public.incidents(dataset_id);

create index if not exists idx_incident_analysis_risk_score on public.incident_analysis(risk_score desc);
create index if not exists idx_incident_analysis_is_sif on public.incident_analysis(is_sif_precursor);
create index if not exists idx_incident_analysis_lsr_code on public.incident_analysis(lsr_code);

create index if not exists idx_incident_reviews_incident on public.incident_reviews(incident_id);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_processing_jobs_dataset on public.processing_jobs(dataset_id);

-- ------------------------------------------------------------
-- 9. AUTOMATIC TIMESTAMP & AUDIT TRIGGERS
-- ------------------------------------------------------------
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
    before update on public.profiles
    for each row execute function public.update_updated_at_column();

create trigger trg_datasets_updated_at
    before update on public.datasets
    for each row execute function public.update_updated_at_column();

create trigger trg_incidents_updated_at
    before update on public.incidents
    for each row execute function public.update_updated_at_column();

-- Auto-record audit log on Human-in-the-Loop review
create or replace function public.log_incident_review_audit()
returns trigger as $$
begin
    insert into public.audit_logs (
        entity_type,
        entity_id,
        action,
        actor_id,
        actor_name,
        details
    ) values (
        'review',
        new.incident_id,
        new.action,
        new.reviewer_id,
        new.reviewer_name,
        jsonb_build_object(
            'review_id', new.id,
            'previous_status', new.previous_status,
            'new_status', new.new_status,
            'justification', new.justification,
            'escalation_notes', new.escalation_notes
        )
    );
    return new;
end;
$$ language plpgsql;

create trigger trg_incident_reviews_audit
    after insert on public.incident_reviews
    for each row execute function public.log_incident_review_audit();

-- ------------------------------------------------------------
-- ------------------------------------------------------------
-- 10. PROFILE ROLE IMMUTABILITY & NEW USER SIGNUP TRIGGERS
-- ------------------------------------------------------------
-- Prevent non-service_role updates to public.profiles.role
create or replace function public.guard_profile_role()
returns trigger as $$
begin
    if (new.role is distinct from old.role) then
        if (current_setting('role', true) != 'service_role') and (coalesce(auth.role(), '') != 'service_role') then
            raise exception 'Access Denied: Changing profile role is strictly prohibited for standard sessions.';
        end if;
    end if;
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_guard_profile_role on public.profiles;
create trigger trg_guard_profile_role
    before update on public.profiles
    for each row execute function public.guard_profile_role();

-- Auto-provision profile on new auth user creation (ALWAYS assigns role 'USER')
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (
        id,
        email,
        full_name,
        role,
        basin,
        designation
    ) values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        'USER', -- ALWAYS 'USER' regardless of raw_user_meta_data
        coalesce(new.raw_user_meta_data->>'basin', 'Assam Operational Basin'),
        coalesce(new.raw_user_meta_data->>'designation', 'HSSE Observer')
    )
    on conflict (id) do update set
        email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name);
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- Two-Role Permission Model: ADMIN (Full Control) | USER (Read-Only)
-- Direct client access using publishable key is constrained strictly by RLS.
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.datasets enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_analysis enable row level security;
alter table public.incident_reviews enable row level security;
alter table public.audit_logs enable row level security;
alter table public.processing_jobs enable row level security;

-- Profiles: Authenticated read; Users can update own profile (guard trigger protects role)
drop policy if exists "Allow read access to profiles" on public.profiles;
drop policy if exists "Allow profile management" on public.profiles;
drop policy if exists "Allow authenticated read profiles" on public.profiles;
drop policy if exists "Allow users to update own non-role profile" on public.profiles;

create policy "Allow authenticated read profiles" on public.profiles
    for select to authenticated using (true);

create policy "Allow users to update own non-role profile" on public.profiles
    for update to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- Datasets: Authenticated read; Admin manage
drop policy if exists "Allow read access to datasets" on public.datasets;
drop policy if exists "Allow dataset management" on public.datasets;
drop policy if exists "Allow authenticated read datasets" on public.datasets;
drop policy if exists "Allow admin dataset modifications" on public.datasets;

create policy "Allow authenticated read datasets" on public.datasets
    for select to authenticated using (true);

create policy "Allow admin dataset modifications" on public.datasets
    for all to authenticated
    using ((select role from public.profiles where id = auth.uid()) = 'ADMIN')
    with check ((select role from public.profiles where id = auth.uid()) = 'ADMIN');

-- Incidents: Authenticated read; Admin manage
drop policy if exists "Allow read access to incidents" on public.incidents;
drop policy if exists "Allow incident modifications" on public.incidents;
drop policy if exists "Allow authenticated read incidents" on public.incidents;
drop policy if exists "Allow admin incident modifications" on public.incidents;

create policy "Allow authenticated read incidents" on public.incidents
    for select to authenticated using (true);

create policy "Allow admin incident modifications" on public.incidents
    for all to authenticated
    using ((select role from public.profiles where id = auth.uid()) = 'ADMIN')
    with check ((select role from public.profiles where id = auth.uid()) = 'ADMIN');

-- Incident Analysis: Authenticated read; Admin manage
drop policy if exists "Allow read access to incident_analysis" on public.incident_analysis;
drop policy if exists "Allow analysis management" on public.incident_analysis;
drop policy if exists "Allow authenticated read incident_analysis" on public.incident_analysis;
drop policy if exists "Allow admin analysis modifications" on public.incident_analysis;

create policy "Allow authenticated read incident_analysis" on public.incident_analysis
    for select to authenticated using (true);

create policy "Allow admin analysis modifications" on public.incident_analysis
    for all to authenticated
    using ((select role from public.profiles where id = auth.uid()) = 'ADMIN')
    with check ((select role from public.profiles where id = auth.uid()) = 'ADMIN');

-- Incident Reviews: Authenticated read; Admin insert
drop policy if exists "Allow read access to reviews" on public.incident_reviews;
drop policy if exists "Allow review insert" on public.incident_reviews;
drop policy if exists "Allow authenticated read reviews" on public.incident_reviews;
drop policy if exists "Allow admin review insert" on public.incident_reviews;

create policy "Allow authenticated read reviews" on public.incident_reviews
    for select to authenticated using (true);

create policy "Allow admin review insert" on public.incident_reviews
    for insert to authenticated
    with check ((select role from public.profiles where id = auth.uid()) = 'ADMIN');

-- Audit Logs: Authenticated read; Authenticated insert (system audit trail)
drop policy if exists "Allow read access to audit_logs" on public.audit_logs;
drop policy if exists "Allow audit log creation" on public.audit_logs;
drop policy if exists "Allow authenticated read audit_logs" on public.audit_logs;
drop policy if exists "Allow authenticated audit log insert" on public.audit_logs;

create policy "Allow authenticated read audit_logs" on public.audit_logs
    for select to authenticated using (true);

create policy "Allow authenticated audit log insert" on public.audit_logs
    for insert to authenticated
    with check (true);

-- Processing Jobs: Authenticated read; Admin manage
drop policy if exists "Allow read access to processing_jobs" on public.processing_jobs;
drop policy if exists "Allow processing job management" on public.processing_jobs;
drop policy if exists "Allow authenticated read processing_jobs" on public.processing_jobs;
drop policy if exists "Allow admin processing job modifications" on public.processing_jobs;

create policy "Allow authenticated read processing_jobs" on public.processing_jobs
    for select to authenticated using (true);

create policy "Allow admin processing job modifications" on public.processing_jobs
    for all to authenticated
    using ((select role from public.profiles where id = auth.uid()) = 'ADMIN')
    with check ((select role from public.profiles where id = auth.uid()) = 'ADMIN');


