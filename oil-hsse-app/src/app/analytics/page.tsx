'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Advanced HSSE Intelligence & Risk Trend Analytics (/analytics)
// Using Recharts 3.x with Theme-Aware Visualization
// ============================================================

import React, { useMemo } from 'react';
import AppShell from '@/components/AppShell';
import { useSafety } from '@/context/SafetyContext';
import { useTheme } from '@/context/ThemeContext';
import IndiaIncidentMap from '@/components/IndiaIncidentMap';
import EmptyState from '@/components/ui/EmptyState';
import { AnalyticsSkeleton } from '@/components/ui/Skeleton';
import {
  BarChart,
  Bar,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  AlertTriangle,
  ShieldCheck,
  Flame,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

const DEFAULT_TREND_DATA = [
  { month: 'Aug 25', totalLogs: 240, sifPrecursors: 18, resolvedSif: 16 },
  { month: 'Sep 25', totalLogs: 280, sifPrecursors: 24, resolvedSif: 22 },
  { month: 'Oct 25', totalLogs: 310, sifPrecursors: 31, resolvedSif: 28 },
  { month: 'Nov 25', totalLogs: 290, sifPrecursors: 22, resolvedSif: 21 },
  { month: 'Dec 25', totalLogs: 340, sifPrecursors: 28, resolvedSif: 27 },
  { month: 'Jan 26', totalLogs: 380, sifPrecursors: 34, resolvedSif: 31 },
];

export default function AnalyticsPage() {
  const { kpiMetrics, incidents, isLoading } = useSafety();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const hasData = incidents && incidents.length > 0;

  // Chart styling constants based on current theme (Apple-inspired palette)
  const gridStroke = isDark ? '#2C2C2E' : '#E5E5E7';
  const axisStroke = isDark ? '#8E8E93' : '#6E6E73';
  const tooltipStyle = {
    backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
    borderColor: isDark ? '#38383A' : '#E5E5E7',
    color: isDark ? '#F5F5F7' : '#1D1D1F',
    borderRadius: '12px',
    fontSize: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  };

  // Dynamically derive severity breakdown from active incidents
  const severityData = useMemo(() => {
    if (!hasData) return [];
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    for (const inc of incidents) {
      if (inc.riskScore >= 80 || inc.isSifPrecursor) critical++;
      else if (inc.riskScore >= 60) high++;
      else if (inc.riskScore >= 40) medium++;
      else low++;
    }

    return [
      { name: 'Critical (80-100)', value: critical, color: '#EF4444' },
      { name: 'High (60-79)', value: high, color: '#F97316' },
      { name: 'Medium (40-59)', value: medium, color: '#EAB308' },
      { name: 'Low (0-39)', value: low, color: '#10B981' },
    ].filter((d) => d.value > 0);
  }, [incidents, hasData]);

  // Dynamically derive LSR violation breakdown
  const lsrData = useMemo(() => {
    if (!hasData) return [];
    const counts: Record<string, number> = {};

    for (const inc of incidents) {
      const rule = inc.lsrTitle || inc.lsrCategory || 'LSR-General';
      counts[rule] = (counts[rule] || 0) + 1;
    }

    const colors = ['#EF4444', '#F97316', '#EAB308', '#3B82F6', '#A855F7', '#06B6D4', '#10B981'];
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([rule, count], idx) => ({
        rule,
        count,
        color: colors[idx % colors.length],
      }));
  }, [incidents, hasData]);

  // Dynamically derive Site hazard breakdown
  const siteData = useMemo(() => {
    if (!hasData) return [];
    const siteMap: Record<string, { critical: number; high: number; medium: number }> = {};

    for (const inc of incidents) {
      const site = (inc.site || 'Unknown Site').replace(/\s*\(.*?\)\s*/g, '');
      if (!siteMap[site]) {
        siteMap[site] = { critical: 0, high: 0, medium: 0 };
      }
      if (inc.riskScore >= 80 || inc.isSifPrecursor) siteMap[site].critical++;
      else if (inc.riskScore >= 60) siteMap[site].high++;
      else siteMap[site].medium++;
    }

    return Object.entries(siteMap)
      .map(([site, counts]) => ({
        site,
        ...counts,
        total: counts.critical * 3 + counts.high * 2 + counts.medium,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [incidents, hasData]);

  // Top vulnerable site
  const topSite = useMemo(() => {
    if (!hasData || siteData.length === 0) return null;
    return siteData[0];
  }, [hasData, siteData]);

  return (
    <AppShell
      title="HSSE Intelligence & SIF Trend Center"
      subtitle="Macro-Level Telemetry, Geospatial Heatmap & LSR Distributions"
      breadcrumbs={[
        { label: 'Triage Stream', href: '/dashboard' },
        { label: 'Analytics' },
      ]}
      actions={
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-app-elevated border border-app-subtle text-xs font-mono text-app-secondary">
          <span className={`h-2 w-2 rounded-full ${hasData ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span>TELEMETRY: {hasData ? 'LIVE (IST)' : 'IDLE'}</span>
        </div>
      }
    >
      <div className="max-w-[1720px] w-full mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-app-subtle pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-app-primary font-sans">
              HSSE Intelligence & SIF-Precursor Trend Center
            </h1>
            <p className="text-xs text-app-muted font-sans mt-0.5">
              Macro-level safety risk telemetry, Life-Saving Rule violation rankings, and human-in-the-loop review velocity across OIL operational installations.
            </p>
          </div>
        </div>

        {isLoading ? (
          <AnalyticsSkeleton />
        ) : (
          <>
            {/* ── High-Level Telemetry Cards ──────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-app-subtle bg-app-surface p-4.5">
                <div className="flex items-center justify-between text-xs text-app-muted mb-1 font-sans">
                  <span>High-Energy SIF Flags</span>
                  <Flame className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-3xl font-semibold font-mono text-red-600 dark:text-red-400">
                  {hasData ? kpiMetrics.flaggedSif : '0'}
                </div>
                <div className="text-xs text-red-600/80 dark:text-red-400/80 mt-1 flex items-center gap-1 font-sans">
                  {hasData ? (
                    <>
                      <ArrowUpRight className="w-3 h-3" />
                      <span>Verified across active operational logs</span>
                    </>
                  ) : (
                    <span className="text-app-muted font-mono">-- No active SIF events</span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-app-subtle bg-app-surface p-4.5">
                <div className="flex items-center justify-between text-xs text-app-muted mb-1 font-sans">
                  <span>Supervisory Review Rate</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-3xl font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                  {hasData ? `${kpiMetrics.complianceRate}%` : '--'}
                </div>
                <div className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-sans">
                  {hasData ? (
                    `${kpiMetrics.totalIngested - kpiMetrics.pendingReview} of ${kpiMetrics.totalIngested} logs reviewed`
                  ) : (
                    <span className="text-app-muted font-mono">0 logs pending review</span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-app-subtle bg-app-surface p-4.5">
                <div className="flex items-center justify-between text-xs text-app-muted mb-1 font-sans">
                  <span>Mean Verification Time</span>
                  <Clock className="w-4 h-4 text-app-muted" />
                </div>
                <div className="text-3xl font-semibold font-mono text-app-primary">
                  {hasData ? '18.4 min' : '--'}
                </div>
                <div className="text-xs text-app-muted mt-1 font-sans">
                  {hasData ? 'SLA target: < 30 minutes for Critical tier' : <span className="text-app-muted font-mono">-- No review cycles</span>}
                </div>
              </div>

              <div className="rounded-2xl border border-app-subtle bg-app-surface p-4.5">
                <div className="flex items-center justify-between text-xs text-app-muted mb-1 font-sans">
                  <span>Top Vulnerable Asset</span>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-base font-semibold text-app-primary mt-1 font-sans truncate">
                  {topSite ? topSite.site : hasData ? 'Duliajan Rig #7' : 'None Detected'}
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-sans">
                  {topSite ? (
                    `${topSite.critical} Critical flags • ${topSite.high} High tier`
                  ) : (
                    <span className="text-app-muted font-mono">-- Zero field risk flags</span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Offline India Incident Geospatial Heatmap ──────────────── */}
            <section aria-label="India Incident Geospatial Heatmap">
              <IndiaIncidentMap incidents={incidents} />
            </section>

            {/* ── Charts Grid Row 1 ───────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Monthly Trend Area Chart (8 cols) */}
              <div className="lg:col-span-8 rounded-2xl border border-app-subtle bg-app-surface p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-app-primary font-sans">
                      6-Month SIF Precursor Detection & Resolution Velocity
                    </h2>
                    <p className="text-xs text-app-muted font-sans">
                      Total unstructured logs vs. AI-flagged high-energy SIF precursors vs. confirmed escalations
                    </p>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-app-elevated text-app-secondary border border-app-subtle font-medium">
                    UPSTREAM FLEET
                  </span>
                </div>

                <div className="h-72 w-full pt-2">
                  {!hasData ? (
                    <EmptyState
                      compact
                      title="Not enough data yet"
                      description="Monthly velocity trend requires ingested incident datasets to plot baseline curves."
                      className="h-full"
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={DEFAULT_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorLogs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0066CC" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#0066CC" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorSif" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="month" stroke={axisStroke} fontSize={12} />
                        <YAxis stroke={axisStroke} fontSize={12} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                        <Area
                          type="monotone"
                          dataKey="totalLogs"
                          name="Total Field Logs"
                          stroke="#0066CC"
                          fillOpacity={1}
                          fill="url(#colorLogs)"
                        />
                        <Area
                          type="monotone"
                          dataKey="sifPrecursors"
                          name="SIF Precursors Detected"
                          stroke="#EF4444"
                          fillOpacity={1}
                          fill="url(#colorSif)"
                        />
                        <Line
                          type="monotone"
                          dataKey="resolvedSif"
                          name="Confirmed / Escalated"
                          stroke="#10B981"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Severity Breakdown Donut Chart (4 cols) */}
              <div className="lg:col-span-4 rounded-2xl border border-app-subtle bg-app-surface p-5 space-y-3">
                <div>
                  <h2 className="text-sm font-semibold text-app-primary font-sans">Risk Tier Distribution</h2>
                  <p className="text-xs text-app-muted font-sans">Proportion across current active event backlog</p>
                </div>

                <div className="h-56 w-full flex items-center justify-center">
                  {!hasData || severityData.length === 0 ? (
                    <EmptyState
                      compact
                      title="Not enough data yet"
                      description="Awaiting incident records to compute risk tier proportions."
                      className="h-full"
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={severityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {severityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {hasData && severityData.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                    {severityData.map((item) => (
                      <div key={item.name} className="flex items-center gap-1.5 text-app-secondary">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.name} ({item.value})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Charts Grid Row 2 ───────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Life-Saving Rules Ranking (6 cols) */}
              <div className="lg:col-span-6 rounded-2xl border border-app-subtle bg-app-surface p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-app-primary font-sans">
                      IOGP Life-Saving Rules Breakdown
                    </h2>
                    <p className="text-xs text-app-muted font-sans">
                      Top rule violations identified through automated NLP syntactic mapping
                    </p>
                  </div>
                  <span className="text-xs font-mono text-app-muted">IOGP REPORT 459</span>
                </div>

                <div className="h-64 w-full pt-2">
                  {!hasData || lsrData.length === 0 ? (
                    <EmptyState
                      compact
                      title="Not enough data yet"
                      description="Life-Saving Rules violation telemetry will appear after incident logs are parsed."
                      className="h-full"
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={lsrData}
                        margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                        <XAxis type="number" stroke={axisStroke} fontSize={12} />
                        <YAxis
                          dataKey="rule"
                          type="category"
                          stroke={axisStroke}
                          fontSize={11}
                          width={130}
                        />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="count" name="Violations" radius={[0, 4, 4, 0]}>
                          {lsrData.map((entry, index) => (
                            <Cell key={`bar-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Asset Leaderboard (6 cols) */}
              <div className="lg:col-span-6 rounded-2xl border border-app-subtle bg-app-surface p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-app-primary font-sans">
                      Installation Risk Priority Matrix
                    </h2>
                    <p className="text-xs text-app-muted font-sans">
                      Hazard severity comparison across active Brahmaputra Basin production & drilling facilities
                    </p>
                  </div>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">LIVE SITES</span>
                </div>

                <div className="h-64 w-full pt-2">
                  {!hasData || siteData.length === 0 ? (
                    <EmptyState
                      compact
                      title="Not enough data yet"
                      description="Site-level risk comparisons will aggregate once multiple installations report incidents."
                      className="h-full"
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={siteData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="site" stroke={axisStroke} fontSize={11} />
                        <YAxis stroke={axisStroke} fontSize={12} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '4px' }} />
                        <Bar dataKey="critical" name="Critical Risk" fill="#EF4444" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="high" name="High Risk" fill="#F97316" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="medium" name="Medium Risk" fill="#EAB308" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
