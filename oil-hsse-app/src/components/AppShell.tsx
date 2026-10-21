'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Unified Enterprise Application Shell (Phase 3 Standardized Shell)
// Strict Compliance: No Horizontal Overflow, Standard Spacing,
// Route Awareness, Keyboard Navigation, and Dual-Theme Adaptation
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import IngestionModal from '@/components/IngestionModal';
import ThemeToggleSwitch from '@/components/ui/ThemeToggleSwitch';
import { useAuth } from '@/context/AuthContext';
import { useSafety } from '@/context/SafetyContext';
import { useTimeFormat } from '@/context/TimeFormatContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { UserRole } from '@/types/safety';
import {
  Menu,
  Clock,
  PlusCircle,
  ShieldCheck,
  User,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  Shield,
} from 'lucide-react';
import { FULL_VERSION_STRING } from '@/config/version';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  showAmbientBackground?: boolean;
  backgroundElement?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function AppShell({
  children,
  title,
  subtitle,
  breadcrumbs,
  showAmbientBackground = false,
  backgroundElement,
  actions,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { role, session, logout, isAuthLoading, isAuthenticated } = useAuth();
  const { openIngestionModal } = useSafety();
  const { timeFormat, setTimeFormat } = useTimeFormat();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [timeString, setTimeString] = useState('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Route Guard: If not loading and not authenticated, immediately redirect to /login
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Back-button BFCache protection: handle pageshow with persisted event
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted && !isAuthenticated) {
        router.replace('/login');
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [isAuthenticated, router]);

  // Reset scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  // Restore sidebar collapsed preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('oil_sidebar_collapsed');
      if (stored === 'true') {
        setIsSidebarCollapsed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('oil_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Clock in Asia/Kolkata (IST)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: timeFormat === '12h' ? 'numeric' : '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: timeFormat === '12h',
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timeFormat]);

  // Handle outside click & escape key for header dropdown
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isRoleDropdownOpen) {
        setIsRoleDropdownOpen(false);
      }
    },
    [isRoleDropdownOpen]
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // While checking session or re-authenticating, do not render protected content
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0E1424] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mb-4" />
        <p className="font-mono text-xs text-neutral-400 tracking-wider uppercase">
          Verifying HSSE Surveillance Session...
        </p>
      </div>
    );
  }

  // Refuse to render protected content if unauthenticated
  if (!isAuthenticated || !session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-app-page text-app-primary flex selection:bg-amber-500/20 selection:text-amber-800 dark:selection:text-amber-300 overflow-x-clip">
      {/* ── Persistent Desktop Sidebar + Mobile Drawer ─────────── */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* ── Main Workspace Area (Zero Horizontal Overflow) ─────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative overflow-x-clip">
        {/* Optional Ambient Background (e.g., throttled canvas on Dashboard) */}
        {showAmbientBackground && backgroundElement && (
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ zIndex: 0 }}>
            {backgroundElement}
          </div>
        )}

        {/* ── Sticky Executive Top Header ───────────────────────── */}
        <header
          className="sticky top-0 z-20 h-14 bg-app-surface/95 backdrop-blur-md border-b border-app-subtle px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-3 select-none"
          style={{ zIndex: 20 }}
        >
          {/* Left: Hamburger (mobile) + Breadcrumbs / Page Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
              aria-expanded={isMobileMenuOpen}
              className="lg:hidden p-2 -ml-1 rounded-lg text-app-secondary hover:text-app-primary hover:bg-app-hover transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex flex-col min-w-0 justify-center">
              {breadcrumbs && breadcrumbs.length > 0 ? (
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-app-muted truncate font-sans">
                  {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <span className="text-app-muted/50 text-[10px]">/</span>}
                      {crumb.href ? (
                        <Link
                          href={crumb.href}
                          className="hover:text-app-primary transition-colors truncate"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="text-app-primary font-semibold truncate">
                          {crumb.label}
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </nav>
              ) : title ? (
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="font-sans font-bold text-xs sm:text-sm text-app-primary tracking-tight truncate">
                    {title}
                  </h1>
                  {subtitle && (
                    <>
                      <span className="text-app-muted hidden sm:inline">•</span>
                      <span className="text-xs text-app-muted font-normal hidden sm:inline truncate">
                        {subtitle}
                      </span>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Right: Operational Status, IST Clock, Theme Toggle, Role Dropdown, Action Button */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {/* Custom page actions if provided */}
            {actions && <div className="hidden md:flex items-center gap-2">{actions}</div>}

            {/* Live IST Clock with 24H/12H toggle */}
            <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-app-secondary bg-app-elevated border border-app-subtle px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-app-muted" />
              <span suppressHydrationWarning className="text-[11px]">
                {timeString || (timeFormat === '12h' ? '08:00:00 AM IST' : '08:00:00 IST')}
              </span>
              <div className="inline-flex items-center ml-1 border-l border-app-subtle pl-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setTimeFormat('24h')}
                  className={`px-1 rounded cursor-pointer transition-colors ${
                    timeFormat === '24h'
                      ? 'font-bold text-[#0066CC] dark:text-[#2997FF] bg-[#0066CC]/10 dark:bg-[#2997FF]/15'
                      : 'text-app-muted hover:text-app-primary'
                  }`}
                  title="24-Hour Military standard time"
                  aria-label="Switch to 24-hour time format"
                >
                  24H
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFormat('12h')}
                  className={`px-1 rounded cursor-pointer transition-colors ${
                    timeFormat === '12h'
                      ? 'font-bold text-[#0066CC] dark:text-[#2997FF] bg-[#0066CC]/10 dark:bg-[#2997FF]/15'
                      : 'text-app-muted hover:text-app-primary'
                  }`}
                  title="12-Hour standard AM/PM time"
                  aria-label="Switch to 12-hour time format"
                >
                  12H
                </button>
              </div>
            </div>

            {/* Accessible Apple-Style Theme Toggle Switch */}
            <ThemeToggleSwitch size="sm" />

            {/* Header Role Switcher Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                aria-expanded={isRoleDropdownOpen}
                aria-haspopup="menu"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-mono text-xs font-bold uppercase transition-all cursor-pointer min-h-[34px] ${
                  role === 'ADMIN'
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/20'
                    : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/40 hover:bg-blue-500/20'
                }`}
                title={`Authenticated session: ${role === 'ADMIN' ? 'Admin' : 'User'}`}
              >
                {role === 'ADMIN' ? (
                  <ShieldCheck className="w-3.5 h-3.5" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
                <span>{role}</span>
                <ChevronDown
                  className={`w-3 h-3 opacity-60 transition-transform ${
                    isRoleDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isRoleDropdownOpen && (
                <div
                  role="menu"
                  aria-label="Active Session Identity"
                  className="absolute right-0 mt-1.5 w-60 rounded-xl bg-app-surface border border-app-strong shadow-2xl py-2 z-50 text-xs animate-fade-in"
                >
                  <div className="px-3 pb-2 border-b border-app-subtle">
                    <span className="font-mono text-[10px] font-bold text-app-muted uppercase tracking-wider block mb-1">
                      Authenticated Identity
                    </span>
                    <div className="font-sans font-bold text-app-primary truncate">
                      {session?.name || 'OIL HSSE Officer'}
                    </div>
                    <div className="text-[11px] text-app-secondary truncate">
                      {session?.email || 'officer@oilindia.in'}
                    </div>
                  </div>

                  <div className="px-3 py-2 border-b border-app-subtle">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-app-secondary">Server Role:</span>
                      <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        role === 'ADMIN'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30'
                      }`}>
                        {role}
                      </span>
                    </div>
                    <div className="text-[10px] text-app-muted mt-1">
                      {role === 'ADMIN' ? 'Admin' : 'User'}
                    </div>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      logout();
                      setIsRoleDropdownOpen(false);
                      toast.info('Signed Out', 'You have been disconnected from the HSSE surveillance session.');
                    }}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="font-sans font-medium text-[11px]">Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Action: Log Report Button */}
            <button
              type="button"
              onClick={openIngestionModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans font-semibold text-xs text-white bg-[#0066CC] hover:bg-[#0077ED] active:scale-95 transition-all shadow-xs cursor-pointer min-h-[34px]"
              title="Log Safety Observation / Ingest Field Incident"
              aria-label="Log Safety Report"
            >
              <PlusCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Log Report</span>
            </button>
          </div>
        </header>

        {/* ── Main Content Area (Zero Horizontal Overflow) ─────── */}
        <main
          className="flex-1 flex flex-col relative w-full min-w-0 overflow-x-clip"
          style={{ zIndex: 1 }}
        >
          {children}
        </main>

        {/* ── Enterprise Statutory Footer ───────────────────────── */}
        <footer className="mt-auto border-t border-app-subtle bg-app-surface text-app-muted py-3 px-4 lg:px-6">
          <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-app-secondary">
                © {new Date().getFullYear()} OIL INDIA LIMITED • UPSTREAM HSSE DIRECTORATE • DULIAJAN, ASSAM
              </span>
              <span className="hidden md:inline text-app-subtle">•</span>
              <a
                href="mailto:hsse-support@oilindia.in"
                className="text-app-muted hover:text-[#0066CC] dark:hover:text-[#2997FF] underline underline-offset-2 transition-colors cursor-pointer"
              >
                hsse-support@oilindia.in
              </a>
            </div>

            <div className="flex items-center gap-3 text-app-muted text-[10px] flex-wrap justify-center">
              <span>STATUTORY: OISD-105 • DGMS OMR-2017 • IOGP R459</span>
              <span className="hidden sm:inline">|</span>
              <span className="text-amber-700 dark:text-[#D4AF37]">
                SIH26165 · THΞ ΛRPΛNΞT
              </span>
              <span className="hidden sm:inline">|</span>
              <span className="font-semibold text-app-primary bg-app-elevated px-1.5 py-0.5 rounded border border-app-subtle">
                {FULL_VERSION_STRING}
              </span>
            </div>
          </div>
        </footer>

        {/* ── Global Ingestion Modal (Accessible from any page) ─── */}
        <IngestionModal />
      </div>
    </div>
  );
}
