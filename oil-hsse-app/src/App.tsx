'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Main Dashboard Workspace Container (Prompt v2.0 - Section 4 & 5)
// ============================================================

import React from 'react';
import AppShell from '@/components/AppShell';
import KpiRibbon from '@/components/KpiRibbon';
import TriageStream from '@/components/TriageStream';
import InferenceNetworkBackground from '@/components/InferenceNetworkBackground';

export default function App() {
  return (
    <AppShell
      title="SIF Priority Triage Stream"
      subtitle="Deterministic Precursor Intelligence"
      breadcrumbs={[
        { label: 'OIL Operations', href: '/dashboard' },
        { label: 'Triage Stream' },
      ]}
      showAmbientBackground
      backgroundElement={<InferenceNetworkBackground />}
    >
      {/* ── Global HSSE KPI Ribbon ────────────────────────── */}
      <KpiRibbon />

      {/* ── Main Workspace: Single Full-Width Priority Triage Feed ─── */}
      <div className="flex-1 max-w-[1720px] w-full mx-auto px-4 lg:px-6 py-4">
        <TriageStream />
      </div>
    </AppShell>
  );
}
