'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Persistent Enterprise Left Navigation Sidebar (Phase 3 Shell)
// Strict Compliance: Fixed Scrolling (100dvh sticky), Resizable
// Drag Handle (RAF + Pointer Capture), Keyboard Accessible,
// Accessible Day/Night Switch, and Collapsed Mode Tooltips
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useSafety } from '@/context/SafetyContext';
import { useToast } from '@/context/ToastContext';
import ThemeToggleSwitch from '@/components/ui/ThemeToggleSwitch';
import { UserRole } from '@/types/safety';
import {
  LayoutDashboard,
  Database,
  BarChart3,
  BookOpen,
  ShieldCheck,
  Shield,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  PlusCircle,
  MapPin,
  X,
  Radio,
  Bot,
} from 'lucide-react';
import { FULL_VERSION_STRING } from '@/config/version';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  isMobileOpen = false,
  onMobileClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, session, logout } = useAuth();
  const { theme } = useTheme();
  const { openIngestionModal } = useSafety();
  const toast = useToast();
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  // ── Resizable Desktop Width Management ──────────────────────
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const isDraggingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const asideRef = useRef<HTMLElement>(null);

  // Restore stored width on mount
  useEffect(() => {
    try {
      const storedW = localStorage.getItem('oil_sidebar_width');
      if (storedW) {
        const parsed = parseInt(storedW, 10);
        if (!isNaN(parsed) && parsed >= 180 && parsed <= 380) {
          setSidebarWidth(parsed);
          if (!isCollapsed) {
            document.documentElement.style.setProperty('--sidebar-w', `${parsed}px`);
          }
        }
      }
    } catch {
      // ignore
    }
  }, [isCollapsed]);

  // Sync CSS variable when collapsed state flips
  useEffect(() => {
    if (isCollapsed) {
      document.documentElement.style.setProperty('--sidebar-w', '68px');
    } else {
      document.documentElement.style.setProperty('--sidebar-w', `${sidebarWidth}px`);
    }
  }, [isCollapsed, sidebarWidth]);

  // Lock background body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileOpen]);

  // Handle outside click & escape key for role menu and mobile drawer
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isRoleMenuOpen) {
          setIsRoleMenuOpen(false);
        } else if (isMobileOpen && onMobileClose) {
          onMobileClose();
        }
      }
    },
    [isRoleMenuOpen, isMobileOpen, onMobileClose]
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setIsRoleMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // ── High-Performance Pointer-Capture Dragging (Zero React State Per Move) ──
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Primary click only
    e.preventDefault();
    isDraggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    document.body.classList.add('resizing-sidebar');
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const currentX = e.clientX;

    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      if (currentX < 140) {
        document.documentElement.style.setProperty('--sidebar-w', '68px');
      } else {
        const clamped = Math.min(360, Math.max(200, currentX));
        document.documentElement.style.setProperty('--sidebar-w', `${clamped}px`);
      }
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    document.body.classList.remove('resizing-sidebar');

    const finalX = e.clientX;
    if (finalX < 140) {
      if (onToggleCollapse && !isCollapsed) {
        onToggleCollapse();
      }
      document.documentElement.style.setProperty('--sidebar-w', '68px');
    } else {
      const clamped = Math.min(360, Math.max(200, finalX));
      setSidebarWidth(clamped);
      document.documentElement.style.setProperty('--sidebar-w', `${clamped}px`);
      try {
        localStorage.setItem('oil_sidebar_width', String(clamped));
      } catch {
        // ignore
      }
      if (isCollapsed && onToggleCollapse) {
        onToggleCollapse();
      }
    }
  };

  const handleDoubleClick = () => {
    setSidebarWidth(256);
    document.documentElement.style.setProperty('--sidebar-w', '256px');
    try {
      localStorage.setItem('oil_sidebar_width', '256');
    } catch {
      // ignore
    }
    if (isCollapsed && onToggleCollapse) {
      onToggleCollapse();
    }
  };

  const handleHandleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 24 : 8;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = Math.max(120, sidebarWidth - step);
      if (next < 140) {
        if (onToggleCollapse && !isCollapsed) onToggleCollapse();
        document.documentElement.style.setProperty('--sidebar-w', '68px');
      } else {
        const clamped = Math.max(200, next);
        setSidebarWidth(clamped);
        document.documentElement.style.setProperty('--sidebar-w', `${clamped}px`);
        try {
          localStorage.setItem('oil_sidebar_width', String(clamped));
        } catch {
          // ignore
        }
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (isCollapsed && onToggleCollapse) {
        onToggleCollapse();
      }
      const next = Math.min(360, Math.max(200, sidebarWidth + step));
      setSidebarWidth(next);
      document.documentElement.style.setProperty('--sidebar-w', `${next}px`);
      try {
        localStorage.setItem('oil_sidebar_width', String(next));
      } catch {
        // ignore
      }
    }
  };

  const navLinks = [
    {
      href: '/dashboard',
      label: 'Triage Stream',
      description: 'SIF Priority Feed',
      icon: LayoutDashboard,
    },
    {
      href: '/datasets',
      label: 'Datasets & Models',
      description: 'Ingestion & Quality',
      icon: Database,
    },
    {
      href: '/analytics',
      label: 'Operational Analytics',
      description: 'Risk Intelligence',
      icon: BarChart3,
    },
    {
      href: '/guidelines',
      label: 'IOGP Guidelines',
      description: 'Safety Rules & Controls',
      icon: BookOpen,
    },
    {
      href: '/chatbot',
      label: 'AI Chatbot',
      description: 'Intelligent Safety Assistant',
      icon: Bot,
    },
  ];

  const handleLogout = () => {
    logout();
    setIsRoleMenuOpen(false);
    if (onMobileClose) onMobileClose();
    toast.info('Signed Out', 'You have been disconnected from the HSSE surveillance session.');
    router.push('/login');
  };

  const handleLinkClick = () => {
    if (onMobileClose) onMobileClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full select-none justify-between">
      {/* ── Upper Section: Brand, CTA & Navigation ──────────────── */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div
          className={`h-14 flex items-center border-b border-app-subtle px-3 transition-all flex-shrink-0 ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <Link
            href="/dashboard"
            onClick={handleLinkClick}
            className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg p-1 transition-transform"
            title="OIL HSSE SIF Decision Support Platform"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/30 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/arpanet-logo.svg"
                alt="THΞ ΛRPΛNΞT Logo"
                width={26}
                height={26}
                className="w-6 h-6 object-contain"
              />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-sans font-bold text-xs tracking-tight text-app-primary">
                    OIL INDIA
                  </span>
                  <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold text-amber-700 dark:text-[#D4AF37] bg-amber-500/10 border border-amber-500/20 tracking-tight">
                    {FULL_VERSION_STRING}
                  </span>
                </div>
                <span className="text-[10px] font-sans text-app-muted truncate">
                  HSSE SIF-Precursor
                </span>
              </div>
            )}
          </Link>

          {/* Close button for mobile drawer */}
          {onMobileClose && (
            <button
              type="button"
              onClick={onMobileClose}
              className="lg:hidden p-1.5 rounded-lg text-app-muted hover:text-app-primary hover:bg-app-hover transition-colors cursor-pointer"
              aria-label="Close Navigation Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Primary Ingestion CTA */}
        <div className="p-2.5 pb-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              openIngestionModal();
              if (onMobileClose) onMobileClose();
            }}
            className={`w-full flex items-center gap-2 rounded-lg font-sans font-semibold text-xs text-white bg-[#0066CC] hover:bg-[#0077ED] active:scale-95 transition-all shadow-xs cursor-pointer ${
              isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 justify-center'
            }`}
            title="Log Safety Observation / Ingest Batch Incidents"
            aria-label="Log Safety Observation"
          >
            <PlusCircle className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Log Observation</span>}
          </button>
        </div>

        {/* Navigation Links — Internal Smooth Scrolling on Short Viewports */}
        <nav
          className="flex-1 px-2.5 py-1 space-y-1 overflow-y-auto custom-scrollbar min-h-0"
          aria-label="Sidebar Navigation"
        >
          {!isCollapsed && (
            <div className="px-2.5 py-1 text-[9px] font-mono font-semibold uppercase tracking-wider text-app-muted">
              Platform Modules
            </div>
          )}

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href ||
              (link.href !== '/' && pathname.startsWith(link.href)) ||
              (link.href === '/dashboard' && (pathname === '/' || pathname === ''));

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                aria-current={isActive ? 'page' : undefined}
                title={`${link.label} — ${link.description}`}
                className={`relative flex items-center gap-2.5 rounded-lg transition-all font-sans text-xs group ${
                  isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'
                } ${
                  isActive
                    ? 'bg-[#0066CC]/10 text-[#0066CC] dark:text-[#2997FF] dark:bg-[#2997FF]/15 font-semibold border border-[#0066CC]/20 dark:border-[#2997FF]/30 shadow-2xs before:content-[\'\'] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r before:bg-[#0066CC] dark:before:bg-[#2997FF]'
                    : 'text-app-secondary hover:text-app-primary hover:bg-app-hover border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive
                      ? 'text-[#0066CC] dark:text-[#2997FF]'
                      : 'text-app-muted group-hover:text-app-primary'
                  }`}
                />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="truncate leading-snug">{link.label}</div>
                    <div className="text-[10px] text-app-muted truncate font-normal">
                      {link.description}
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Lower Section: Telemetry, Theme Toggle & Session ──── */}
      <div className="border-t border-app-subtle bg-app-elevated/40 flex-shrink-0">
        {/* Real-time Surveillance Pill */}
        {!isCollapsed ? (
          <div className="px-3 py-2 border-b border-app-subtle flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-semibold text-[10px]">LIVE SURVEILLANCE</span>
            </div>
            <span className="text-[10px] text-app-muted">Assam Basin</span>
          </div>
        ) : (
          <div
            className="py-2 border-b border-app-subtle flex justify-center text-emerald-600 dark:text-emerald-400"
            title="Live Surveillance Active · Assam Basin"
          >
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </div>
          </div>
        )}

        {/* Footer Utilities: Accessible Theme Toggle & Desktop Collapse */}
        <div className="p-2.5 pt-2 space-y-2">
          <div
            className={`flex items-center ${
              isCollapsed ? 'flex-col gap-2' : 'justify-between gap-1.5'
            }`}
          >
            {/* Theme Toggle Switch */}
            <ThemeToggleSwitch showLabel={!isCollapsed} size={isCollapsed ? 'sm' : 'md'} />

            {/* Desktop Sidebar Collapse Toggle */}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg border border-app-subtle bg-app-elevated text-app-muted hover:text-app-primary hover:bg-app-hover transition-colors cursor-pointer"
                title={isCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
                aria-label={isCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* User Session & Role Card */}
          <div className="relative" ref={roleMenuRef}>
            <button
              type="button"
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              className={`w-full flex items-center rounded-lg border transition-all cursor-pointer ${
                isCollapsed ? 'p-2 justify-center' : 'p-2 justify-between'
              } ${
                role === 'ADMIN'
                  ? 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10'
                  : 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10'
              }`}
              title={`Active role: ${role}. Click to switch role or sign out.`}
              aria-label="User profile and role menu"
              aria-expanded={isRoleMenuOpen}
              aria-haspopup="menu"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-white font-mono text-xs font-bold ${
                    role === 'ADMIN' ? 'bg-amber-600' : 'bg-[#0066CC]'
                  }`}
                >
                  {role === 'ADMIN' ? (
                    <Shield className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-white" />
                  )}
                </div>

                {!isCollapsed && (
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-xs font-sans font-semibold text-app-primary truncate">
                      {role === 'ADMIN' ? 'Admin' : 'User'}
                    </span>
                    <span className="text-[10px] font-mono text-app-muted truncate">
                      {role === 'ADMIN' ? 'ROLE: ADMIN' : 'ROLE: USER'}
                    </span>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <ChevronDown
                  className={`w-3.5 h-3.5 text-app-muted transition-transform flex-shrink-0 ${
                    isRoleMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>

            {/* Role & Identity Popup */}
            {isRoleMenuOpen && (
              <div
                role="menu"
                className="absolute left-0 bottom-full mb-1.5 w-full min-w-[220px] bg-app-surface border border-app-subtle rounded-xl shadow-xl py-2 z-50 text-xs animate-fade-in-scale"
              >
                <div className="px-3 pb-2 border-b border-app-subtle">
                  <span className="font-mono text-[10px] font-bold text-app-muted uppercase tracking-wider block mb-1">
                    Authenticated Account
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
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="font-sans font-medium text-[11px]">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Persistent Sidebar (Sticky 100dvh & Resizable) ── */}
      <aside
        ref={asideRef}
        style={{ width: 'var(--sidebar-w, 256px)' }}
        className="hidden lg:flex flex-col flex-shrink-0 border-r border-app-subtle bg-app-surface h-[100dvh] sticky top-0 z-30 transition-[width] duration-150 ease-out select-none relative"
        aria-label="Enterprise Navigation"
      >
        {sidebarContent}

        {/* Resizable Drag Handle with Pointer Capture */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize navigation sidebar"
          aria-valuenow={isCollapsed ? 68 : sidebarWidth}
          aria-valuemin={68}
          aria-valuemax={360}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          onKeyDown={handleHandleKeyDown}
          title="Drag to resize sidebar width. Double-click to reset (256px). Left/Right arrow keys to resize."
          className="hidden lg:flex items-center justify-center absolute -right-1.5 top-0 bottom-0 w-3 cursor-col-resize hover:bg-[#0066CC]/20 active:bg-[#0066CC]/40 transition-colors z-40 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]"
        >
          <div className="h-8 w-1 rounded-full bg-app-subtle group-hover:bg-[#0066CC] group-focus-visible:bg-[#0066CC] transition-colors" />
        </div>
      </aside>

      {/* ── Mobile Drawer (Slide-Out) ───────────────────────────── */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Drawer"
        >
          {/* Backdrop with fade-in */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={onMobileClose}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full bg-app-surface border-r border-app-subtle shadow-2xl flex flex-col z-10 animate-fade-in-scale">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
