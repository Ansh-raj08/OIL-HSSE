'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Spotlight New UI Primitive (Apple-Inspired Industrial Safety)
// Aceternity-derived ambient light beams adapted for dual themes,
// pure-CSS compositor animation, zero JS animation loop, zero FOUC,
// mobile attenuation, and strict zero-overflow containment.
// ============================================================

import React from 'react';
import { cn } from '@/lib/utils';

export interface SpotlightProps {
  gradientFirst?: string;
  gradientSecond?: string;
  gradientThird?: string;
  translateY?: number;
  width?: number;
  height?: number;
  smallWidth?: number;
  className?: string;
}

export function Spotlight({
  gradientFirst = 'radial-gradient(68.54% 68.72% at 55.02% 31.46%, var(--spot-1) 0%, var(--spot-2) 50%, transparent 80%)',
  gradientSecond = 'radial-gradient(50% 50% at 50% 50%, var(--spot-1) 0%, var(--spot-2) 100%, transparent 100%)',
  gradientThird = 'radial-gradient(50% 50% at 50% 50%, var(--spot-2) 0%, var(--spot-3) 100%, transparent 100%)',
  translateY = -320,
  width = 560,
  height = 1380,
  smallWidth = 240,
  className,
}: SpotlightProps = {}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 z-0 overflow-hidden select-none',
        className
      )}
    >
      {/* ── Left Spotlight Beam Assembly ──────────────────────────── */}
      <div className="absolute top-0 left-0 w-full md:w-1/2 h-full animate-spotlight-left opacity-60 md:opacity-100 transition-opacity">
        {/* Primary Left Beam */}
        <div
          style={{
            transform: `translateY(${translateY}px) rotate(-45deg)`,
            background: gradientFirst,
            width: `clamp(280px, 45vw, ${width}px)`,
            height: `clamp(700px, 110vh, ${height}px)`,
          }}
          className="absolute top-0 left-0 rounded-full blur-[32px] md:blur-[48px]"
        />

        {/* Secondary Left Beam (Hidden on Mobile for Performance & Contrast) */}
        <div
          style={{
            transform: 'rotate(-45deg) translate(-5%, -50%)',
            background: gradientSecond,
            width: `${smallWidth}px`,
            height: `clamp(700px, 110vh, ${height}px)`,
          }}
          className="hidden md:block absolute top-0 left-0 rounded-full blur-[24px]"
        />

        {/* Tertiary Left Beam (Ambient Diffusion) */}
        <div
          style={{
            transform: 'rotate(-45deg) translate(-180%, -70%)',
            background: gradientThird,
            width: `${smallWidth}px`,
            height: `clamp(700px, 110vh, ${height}px)`,
          }}
          className="hidden md:block absolute top-0 left-0 rounded-full blur-[36px]"
        />
      </div>

      {/* ── Right Spotlight Beam Assembly ─────────────────────────── */}
      <div className="absolute top-0 right-0 w-full md:w-1/2 h-full animate-spotlight-right opacity-60 md:opacity-100 transition-opacity">
        {/* Primary Right Beam */}
        <div
          style={{
            transform: `translateY(${translateY}px) rotate(45deg)`,
            background: gradientFirst,
            width: `clamp(280px, 45vw, ${width}px)`,
            height: `clamp(700px, 110vh, ${height}px)`,
          }}
          className="absolute top-0 right-0 rounded-full blur-[32px] md:blur-[48px]"
        />

        {/* Secondary Right Beam (Hidden on Mobile) */}
        <div
          style={{
            transform: 'rotate(45deg) translate(5%, -50%)',
            background: gradientSecond,
            width: `${smallWidth}px`,
            height: `clamp(700px, 110vh, ${height}px)`,
          }}
          className="hidden md:block absolute top-0 right-0 rounded-full blur-[24px]"
        />

        {/* Tertiary Right Beam (Ambient Diffusion) */}
        <div
          style={{
            transform: 'rotate(45deg) translate(180%, -70%)',
            background: gradientThird,
            width: `${smallWidth}px`,
            height: `clamp(700px, 110vh, ${height}px)`,
          }}
          className="hidden md:block absolute top-0 right-0 rounded-full blur-[36px]"
        />
      </div>
    </div>
  );
}

export default Spotlight;
