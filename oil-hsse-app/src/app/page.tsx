'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Canonical Landing Page: / (Directly Served via PublicShell)
// Aceternity Spotlight + Hover Border Gradient Experience
// Dark-scoped cinematic visual language with WCAG AA compliant contrast.
// Already-authenticated visitors are automatically routed to /dashboard.
// ============================================================

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PublicShell from '@/components/PublicShell';
import HoverBorderGradientDemo from '@/components/ui/hover-border-gradient-demo';

export default function RootLandingPage() {
  const router = useRouter();
  const { isAuthenticated, session } = useAuth();

  // Route authenticated visitors straight to /dashboard
  useEffect(() => {
    if (isAuthenticated && session) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, session, router]);

  return (
    <PublicShell mode="landing">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:py-20 text-center">
        <h1 className="bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-center text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-7xl">
          THΞ ΛRPΛNΞT
          <br />
          <br />
          See the signals before they become incidents.
        </h1>

        <p className="mx-auto mt-6 max-w-lg text-center text-base sm:text-lg font-normal text-neutral-300 leading-relaxed">
          Reads unsafe-act, unsafe-condition and near-miss reports from upstream
          operations, flags potential serious injury and fatality precursors, and
          shows the exact words behind each flag. Safety officers review and decide.
        </p>

        <HoverBorderGradientDemo href="/login" />
      </div>
    </PublicShell>
  );
}
