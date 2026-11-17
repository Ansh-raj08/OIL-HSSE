'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Admin System Status & Deployment Diagnostics (/status)
// - Restricted strictly to signed-in ADMIN users (redirects others)
// - Displays booleans and live statuses only (ZERO secrets / values)
// - Checks: Supabase URL configured, publishable key configured,
//   API base URL configured, backend reachable (status + latency),
//   Supabase reachable (direct + backend), and app version.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { getPublicEnvStatus, MAX_UPLOAD_BYTES } from '@/config/env';
import { FULL_VERSION_STRING } from '@/config/version';
import { apiClient, BackendHealthProbeResult } from '@/lib/api/client';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  ShieldCheck,
  Clock,
  Tag,
} from 'lucide-react';

interface SupabaseDirectProbe {
  checked: boolean;
  reachable: boolean;
  latencyMs: number;
  errorReference: string | null;
}

function StatusPill({ ok, labelOk = 'Configured', labelFail = 'Missing' }: { ok: boolean; labelOk?: string; labelFail?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] font-bold uppercase border ${
        ok
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
      }`}
    >
      {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      <span>{ok ? labelOk : labelFail}</span>
    </span>
  );
}

export default function AdminStatusPage() {
  const router = useRouter();
  const { role, isAuthenticated, isAuthLoading } = useAuth();

  const envStatus = getPublicEnvStatus();
  const [isChecking, setIsChecking] = useState(true);
  const [lastCheckedAt, setLastCheckedAt] = useState<string>('');
  const [backendProbe, setBackendProbe] = useState<BackendHealthProbeResult | null>(null);
  const [supabaseProbe, setSupabaseProbe] = useState<SupabaseDirectProbe>({
    checked: false,
    reachable: false,
    latencyMs: 0,
    errorReference: null,
  });

  // Enforce strict ADMIN-only access
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [isAuthLoading, isAuthenticated, role, router]);

  const runDiagnostics = useCallback(async () => {
    setIsChecking(true);

    // Probe 1: Direct Browser -> Supabase reachability
    const probeSupabaseDirect = async (): Promise<SupabaseDirectProbe> => {
      const client = getSupabaseClient();
      if (!client) {
        return {
          checked: true,
          reachable: false,
          latencyMs: 0,
          errorReference: 'supabase_not_configured',
        };
      }
      const start = performance.now();
      try {
        const { error } = await client
          .from('profiles')
          .select('id', { count: 'exact', head: true });
        const latencyMs = Math.round(performance.now() - start);
        if (error) {
          return {
            checked: true,
            reachable: false,
            latencyMs,
            errorReference: error.code || 'supabase_query_failed',
          };
        }
        return {
          checked: true,
          reachable: true,
          latencyMs,
          errorReference: null,
        };
      } catch {
        return {
          checked: true,
          reachable: false,
          latencyMs: Math.round(performance.now() - start),
          errorReference: 'supabase_network_error',
        };
      }
    };

    const [supaRes, backRes] = await Promise.all([
      probeSupabaseDirect(),
      apiClient.probeAdminHealth(),
    ]);

    setSupabaseProbe(supaRes);
    setBackendProbe(backRes);
    setLastCheckedAt(
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) + ' IST'
    );
    setIsChecking(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated && role === 'ADMIN') {
      runDiagnostics();
    }
  }, [isAuthenticated, role, runDiagnostics]);

  // Prevent non-admin flash before redirect completes
  if (!isAuthLoading && isAuthenticated && role !== 'ADMIN') {
    return null;
  }

  const allConfigOk =
    envStatus.supabaseUrlConfigured &&
    envStatus.supabaseAnonKeyConfigured &&
    envStatus.apiBaseUrlConfigured;
  const backendOk = Boolean(backendProbe?.reachable && backendProbe?.configured !== false);
  const supabaseOk =
    supabaseProbe.reachable &&
    (backendProbe?.supabaseReachable === null || backendProbe?.supabaseReachable === true);
  const allGreen = !isChecking && allConfigOk && backendOk && supabaseOk;

  return (
    <AppShell
      title="System Status & Deployment Diagnostics"
      subtitle="Admin-Only Connectivity & Configuration Verification"
      breadcrumbs={[
        { label: 'Triage Stream', href: '/dashboard' },
        { label: 'System Status' },
      ]}
      actions={
        <button
          type="button"
          onClick={runDiagnostics}
          disabled={isChecking}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0066CC] hover:bg-[#0077ED] disabled:opacity-60 transition-all cursor-pointer font-sans"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Checking...' : 'Re-check'}</span>
        </button>
      }
    >
      <div className="max-w-5xl w-full mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* Top Overall Status Banner */}
        <div
          className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isChecking
              ? 'bg-app-surface border-app-subtle'
              : allGreen
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-amber-500/10 border-amber-500/30'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                isChecking
                  ? 'bg-app-elevated border-app-subtle text-app-muted'
                  : allGreen
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
              }`}
            >
              {isChecking ? (
                <Activity className="w-5 h-5 animate-pulse" />
              ) : allGreen ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h1 className="text-base font-bold text-app-primary font-sans">
                {isChecking
                  ? 'Running live deployment diagnostics...'
                  : allGreen
                    ? 'All systems operational'
                    : 'One or more deployment checks require attention'}
              </h1>
              <p className="text-xs text-app-secondary mt-0.5 font-sans">
                Displays boolean statuses and latencies only. No credentials, keys, or secrets are ever rendered.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {lastCheckedAt && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-app-muted">
                <Clock className="w-3.5 h-3.5" />
                <span>{lastCheckedAt}</span>
              </span>
            )}
            <button
              type="button"
              onClick={runDiagnostics}
              disabled={isChecking}
              className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0066CC] hover:bg-[#0077ED] disabled:opacity-60 transition-all cursor-pointer font-sans"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>Re-check</span>
            </button>
          </div>
        </div>

        {/* Section 1: Frontend Public Configuration */}
        <section className="rounded-xl border border-app-subtle bg-app-surface overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-app-subtle bg-app-elevated/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0066CC] dark:text-[#2997FF]" />
              <h2 className="text-sm font-semibold text-app-primary font-sans">
                Frontend Public Configuration
              </h2>
            </div>
            <StatusPill ok={allConfigOk} labelOk="Valid" labelFail="Misconfigured" />
          </div>

          <div className="divide-y divide-app-subtle text-xs">
            <div className="px-5 py-3.5 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-app-primary font-sans">Supabase URL configured</div>
                <div className="font-mono text-[11px] text-app-muted mt-0.5">NEXT_PUBLIC_SUPABASE_URL</div>
              </div>
              <StatusPill ok={envStatus.supabaseUrlConfigured} labelOk="Yes" labelFail="No" />
            </div>

            <div className="px-5 py-3.5 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-app-primary font-sans">Publishable key configured</div>
                <div className="font-mono text-[11px] text-app-muted mt-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
              </div>
              <StatusPill ok={envStatus.supabaseAnonKeyConfigured} labelOk="Yes" labelFail="No" />
            </div>

            <div className="px-5 py-3.5 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-app-primary font-sans">API base URL configured</div>
                <div className="font-mono text-[11px] text-app-muted mt-0.5">NEXT_PUBLIC_API_URL</div>
              </div>
              <StatusPill ok={envStatus.apiBaseUrlConfigured} labelOk="Yes" labelFail="No" />
            </div>
          </div>
        </section>

        {/* Section 2: Live Connectivity (Backend + Supabase) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Backend Reachability */}
          <section className="rounded-xl border border-app-subtle bg-app-surface overflow-hidden shadow-xs flex flex-col">
            <div className="px-5 py-3.5 border-b border-app-subtle bg-app-elevated/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-amber-600 dark:text-[#D4AF37]" />
                <h2 className="text-sm font-semibold text-app-primary font-sans">
                  FastAPI Backend
                </h2>
              </div>
              {backendProbe ? (
                <StatusPill
                  ok={backendOk}
                  labelOk="Reachable"
                  labelFail={backendProbe.reachable ? 'Misconfigured' : 'Unreachable'}
                />
              ) : (
                <span className="font-mono text-[11px] text-app-muted">Checking...</span>
              )}
            </div>

            <div className="p-5 space-y-3 text-xs flex-1">
              <div className="flex items-center justify-between">
                <span className="text-app-secondary">Backend reachable</span>
                <span className="font-mono font-semibold text-app-primary">
                  {backendProbe ? (backendProbe.reachable ? 'Yes' : 'No') : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-app-secondary">HTTP status</span>
                <span className="font-mono font-semibold text-app-primary">
                  {backendProbe?.httpStatus ?? 'No response'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-app-secondary">Round-trip latency</span>
                <span className="font-mono font-semibold text-app-primary">
                  {backendProbe ? `${backendProbe.latencyMs} ms` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-app-secondary">Backend env configured</span>
                <span className="font-mono font-semibold text-app-primary">
                  {backendProbe?.configured === null || !backendProbe
                    ? '—'
                    : backendProbe.configured
                      ? 'Yes'
                      : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-app-secondary">Persistence mode</span>
                <span className="font-mono font-semibold text-app-primary">
                  {backendProbe?.databaseMode ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-app-secondary">Upload payload limit</span>
                <span className="font-mono font-semibold text-app-primary">
                  {Math.round(((backendProbe?.maxUploadBytes ?? MAX_UPLOAD_BYTES) / (1024 * 1024)) * 10) / 10} MB
                </span>
              </div>

              {backendProbe && backendProbe.missingVars.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300">
                  <div className="font-semibold mb-1">Missing backend variables:</div>
                  <div className="font-mono text-[11px]">
                    {backendProbe.missingVars.join(', ')}
                  </div>
                </div>
              )}

              {backendProbe?.errorMessage && (
                <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300">
                  <p className="font-medium">{backendProbe.errorMessage}</p>
                  {backendProbe.errorReference && (
                    <p className="font-mono text-[11px] opacity-80 mt-0.5">
                      Reference: {backendProbe.errorReference}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Supabase Reachability */}
          <section className="rounded-xl border border-app-subtle bg-app-surface overflow-hidden shadow-xs flex flex-col">
            <div className="px-5 py-3.5 border-b border-app-subtle bg-app-elevated/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-semibold text-app-primary font-sans">
                  Supabase Database
                </h2>
              </div>
              {supabaseProbe.checked ? (
                <StatusPill ok={supabaseOk} labelOk="Reachable" labelFail="Unreachable" />
              ) : (
                <span className="font-mono text-[11px] text-app-muted">Checking...</span>
              )}
            </div>

            <div className="p-5 space-y-3 text-xs flex-1">
              <div className="flex items-center justify-between">
                <span className="text-app-secondary">Browser &rarr; Supabase reachable</span>
                <span className="font-mono font-semibold text-app-primary">
                  {supabaseProbe.checked ? (supabaseProbe.reachable ? 'Yes' : 'No') : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-app-secondary">Browser &rarr; Supabase latency</span>
                <span className="font-mono font-semibold text-app-primary">
                  {supabaseProbe.checked ? `${supabaseProbe.latencyMs} ms` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-app-secondary">Backend &rarr; Supabase reachable</span>
                <span className="font-mono font-semibold text-app-primary">
                  {backendProbe?.supabaseReachable === null || !backendProbe
                    ? '—'
                    : backendProbe.supabaseReachable
                      ? 'Yes'
                      : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-app-secondary">Backend &rarr; Supabase latency</span>
                <span className="font-mono font-semibold text-app-primary">
                  {backendProbe?.supabaseLatencyMs !== null && backendProbe?.supabaseLatencyMs !== undefined
                    ? `${backendProbe.supabaseLatencyMs} ms`
                    : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-app-secondary">Persisted datasets / incidents</span>
                <span className="font-mono font-semibold text-app-primary">
                  {backendProbe?.datasetCount !== null && backendProbe?.datasetCount !== undefined
                    ? `${backendProbe.datasetCount} / ${backendProbe.incidentCount ?? 0}`
                    : '—'}
                </span>
              </div>

              {supabaseProbe.errorReference && (
                <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300">
                  <p className="font-medium">Could not verify direct Supabase database access.</p>
                  <p className="font-mono text-[11px] opacity-80 mt-0.5">
                    Reference: {supabaseProbe.errorReference}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Section 3: Version Info */}
        <section className="rounded-xl border border-app-subtle bg-app-surface px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-app-secondary">
            <Tag className="w-4 h-4 text-app-muted" />
            <span className="font-semibold text-app-primary">App Version</span>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <span className="text-app-secondary">
              Frontend: <strong className="text-app-primary">{FULL_VERSION_STRING}</strong>
            </span>
            <span className="text-app-muted">|</span>
            <span className="text-app-secondary">
              Backend: <strong className="text-app-primary">{backendProbe?.backendVersion ?? '—'}</strong>
            </span>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
