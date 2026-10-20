'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Accessible Apple-Style Theme Toggle Switch (SIH26165)
// Sliding Thumb, SVG Rotation/Crossfade, Keyboard Operable
// ============================================================

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleSwitchProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export default function ThemeToggleSwitch({
  className = '',
  showLabel = false,
  size = 'md',
}: ThemeToggleSwitchProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  // If not yet mounted on client, determine initial dark state from HTML class if available
  const isDark = mounted
    ? theme === 'dark'
    : typeof document !== 'undefined'
    ? !document.documentElement.classList.contains('light')
    : true;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleTheme();
    }
  };

  const isSmall = size === 'sm';
  const trackWidth = isSmall ? 'w-11 h-6' : 'w-13 h-7';
  const thumbSize = isSmall ? 'w-5 h-5' : 'w-5.5 h-5.5';
  const translatePos = isSmall
    ? isDark ? 'translate-x-5' : 'translate-x-0'
    : isDark ? 'translate-x-6' : 'translate-x-0';

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={`Switch to ${isDark ? 'Day' : 'Night'} Mode`}
        title={`Active: ${isDark ? 'Control Room (Dark)' : 'Day (Light)'} Mode. Click or press Space to switch.`}
        onClick={toggleTheme}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex items-center rounded-full p-0.5 transition-colors cursor-pointer border border-app-subtle bg-app-elevated hover:bg-app-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] dark:focus-visible:ring-[#2997FF] ${trackWidth}`}
      >
        {/* Track Icons for Visual Anchors */}
        <div className="absolute inset-0 px-1.5 flex items-center justify-between pointer-events-none opacity-40">
          <Sun className="w-3 h-3 text-amber-500" />
          <Moon className="w-3 h-3 text-blue-400" />
        </div>

        {/* Sliding Animated Thumb */}
        <span
          className={`relative z-10 flex items-center justify-center rounded-full bg-app-surface shadow-xs border border-app-subtle transform transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${thumbSize} ${translatePos}`}
        >
          {isDark ? (
            <Moon className="w-3 h-3 text-blue-500 dark:text-[#2997FF] animate-fade-in" />
          ) : (
            <Sun className="w-3 h-3 text-amber-500 animate-fade-in" />
          )}
        </span>
      </button>

      {showLabel && (
        <span className="text-xs font-mono text-app-secondary">
          {isDark ? 'Control Room' : 'Day Mode'}
        </span>
      )}
    </div>
  );
}
