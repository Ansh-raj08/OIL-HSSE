-- ============================================================
-- OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
-- Migration: 002_security_rls_and_profile_guard.sql
-- Description: Strict Row-Level Security, Immutability of profiles.role,
--              and New User Signup Role Defaulting (SIH26165)
-- ============================================================

-- 1. GUARD TRIGGER ON profiles.role
-- Enforce that profiles.role CANNOT be updated by any client-side caller.
-- Only the service_role key can update roles in public.profiles.
create or replace function public.guard_profile_role()
returns trigger as $$
begin
    -- If role is being changed and the executing role is not service_role, reject
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


-- 2. SECURE SIGNUP TRIGGER ON auth.users
-- Automatically create a profile upon user registration.
-- CRITICAL SECURITY RULE: The role is ALWAYS 'USER'.
-- Never copy role from user-supplied raw_user_meta_data.
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


-- 3. HARDEN ROW LEVEL SECURITY POLICIES
-- Enable RLS across all tables
alter table public.profiles enable row level security;
alter table public.datasets enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_analysis enable row level security;
alter table public.incident_reviews enable row level security;
alter table public.audit_logs enable row level security;
alter table public.processing_jobs enable row level security;

-- PROFILES
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

-- DATASETS
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

-- INCIDENTS
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

-- INCIDENT ANALYSIS
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

-- INCIDENT REVIEWS
drop policy if exists "Allow read access to reviews" on public.incident_reviews;
drop policy if exists "Allow review insert" on public.incident_reviews;
drop policy if exists "Allow authenticated read reviews" on public.incident_reviews;
drop policy if exists "Allow admin review insert" on public.incident_reviews;

create policy "Allow authenticated read reviews" on public.incident_reviews
    for select to authenticated using (true);

create policy "Allow admin review insert" on public.incident_reviews
    for insert to authenticated
    with check ((select role from public.profiles where id = auth.uid()) = 'ADMIN');

-- AUDIT LOGS
drop policy if exists "Allow read access to audit_logs" on public.audit_logs;
drop policy if exists "Allow audit log creation" on public.audit_logs;
drop policy if exists "Allow authenticated read audit_logs" on public.audit_logs;
drop policy if exists "Allow authenticated audit log insert" on public.audit_logs;

create policy "Allow authenticated read audit_logs" on public.audit_logs
    for select to authenticated using (true);

create policy "Allow authenticated audit log insert" on public.audit_logs
    for insert to authenticated
    with check (true);

-- PROCESSING JOBS
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
