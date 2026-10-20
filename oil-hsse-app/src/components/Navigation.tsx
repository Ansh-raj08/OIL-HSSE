'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Two-Tier Executive Navigation Bar (Responsive with Mobile Parity)
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSafety } from '@/context/SafetyContext';
import { useAuth } from '@/context/AuthContext';
import { useTimeFormat } from '@/context/TimeFormatContext';
import { UserRole } from '@/types/safety';
import {
  PlusCircle,
  MapPin,
  Clock,
  User,
  Database,
  BarChart3,
  LayoutDashboard,
  ChevronDown,
  LogOut,
  Shield,
  BookOpen,
  Menu,
  X,
  ShieldCheck,
  Bot,
} from 'lucide-react';
import { FULL_VERSION_STRING } from '@/config/version';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { openIngestionModal } = useSafety();
  const { session, role, switchRole, logout } = useAuth();
  const { timeFormat, setTimeFormat } = useTimeFormat();
  const [timeString, setTimeString] = useState('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on page change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { href: '/dashboard', label: 'Triage Stream', icon: LayoutDashboard },
    { href: '/datasets', label: 'Datasets', icon: Database },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/guidelines', label: 'Guidelines', icon: BookOpen },
    { href: '/chatbot', label: 'AI Chatbot', icon: Bot },
  ];

  const handleRoleChange = (newRole: UserRole) => {
    switchRole(newRole);
    setIsRoleDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsRoleDropdownOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#090D16] border-b border-[#1E293B]">
      {/* ── TIER 1: Primary Navigation Bar (Full Visual Weight) ────── */}
      <div className="max-w-[1720px] mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-3">
        {/* Left: OIL Emblem & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-max">
          <Link
            href="/dashboard"
            className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden hover:opacity-90 transition-all hover:scale-105"
            title="THΞ ΛRPΛNΞT · SIF Decision Support Platform"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/arpanet-logo.svg"
              alt="THΞ ΛRPΛNΞT Logo"
              width={36}
              height={36}
              className="w-9 h-9 object-contain"
            />
          </Link>

          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="font-sans font-semibold text-xs sm:text-sm text-white tracking-tight">
              OIL INDIA LIMITED
            </span>
            <span className="text-slate-600 font-sans hidden xs:inline">•</span>
            <span className="font-sans text-xs text-slate-300 font-normal hidden sm:inline">
              HSSE SIF-Precursor Platform
            </span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-[#D4AF37] bg-[#1E293B]/80 border border-[#D4AF37]/30 tracking-tight select-none hidden lg:inline">
              {FULL_VERSION_STRING}
            </span>
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs (Hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-1 bg-[#0E1424] border border-[#1E293B] rounded-md p-1 text-xs">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href || (link.href === '/dashboard' && pathname === '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-sans font-semibold transition-all ${
                  isActive
                    ? 'bg-[#1E293B] text-[#D4AF37] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#151D2E]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Role Badge + Actions + Mobile Hamburger Menu Button */}
        <div className="flex items-center gap-2">
          {/* ── Role Badge Dropdown (Tier 1, Promoted) ───────────── */}
          <div className="relative hidden sm:block" ref={dropdownRef}>
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-mono text-xs font-bold uppercase transition-all cursor-pointer min-h-[36px] ${
                role === 'ADMIN'
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/40 hover:bg-[#D4AF37]/20 shadow-[0_0_10px_rgba(212,175,55,0.12)]'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/40 hover:bg-blue-500/15'
              }`}
              title={`Active role: ${role}. Click to switch role or sign out.`}
            >
              {role === 'ADMIN' ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
              <span>{role}</span>
              <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-[#0E1424] border border-[#1E293B] shadow-2xl py-2 z-50 text-xs">
                <div className="px-3 pb-2 border-b border-[#1E293B]">
                  <div className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Authenticated Identity
                  </div>
                  <div className="font-sans font-bold text-slate-200 truncate">
                    {session?.name || 'OIL HSSE Officer'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {session?.email || 'officer@oilindia.in'}
                  </div>
                </div>

                <div className="px-3 py-2 border-b border-[#1E293B]">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Verified Role:</span>
                    <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      role === 'ADMIN'
                        ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    }`}>
                      {role}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {role === 'ADMIN' ? 'Chief HSSE Superintendent (Full Authority)' : 'Field Observer (Read-Only)'}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 text-rose-400 hover:bg-[#1E293B] cursor-pointer min-h-[40px] transition-colors mt-1"
                >
                  <div className="w-6 h-6 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                    <LogOut className="w-3 h-3 text-rose-400" />
                  </div>
                  <span className="font-sans font-medium text-[11px]">Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Action Button (Desktop & Tablet) */}
          <button
            onClick={openIngestionModal}
            className="hidden sm:flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded font-sans font-semibold text-xs text-[#090D16] bg-[#D4AF37] hover:bg-[#F59E0B] active:scale-95 transition-all shadow-[0_0_12px_rgba(212,175,55,0.25)] cursor-pointer min-h-[36px]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Report</span>
          </button>

          {/* Mobile Hamburger Toggle Button (Minimum 44px tap target) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg bg-[#0E1424] border border-[#1E293B] text-slate-300 hover:text-white hover:border-[#D4AF37]/50 active:scale-95 transition-all cursor-pointer"
            aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-[#D4AF37]" />
            ) : (
              <Menu className="w-5 h-5 text-slate-300" />
            )}
          </button>
        </div>
      </div>

      {/* ── TIER 2: De-Emphasized Status Strip ───────────────────────── */}
      <div className="bg-[#070A12] border-t border-[#1E293B]/60 py-1.5 px-4 lg:px-6">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between text-xs text-slate-400 font-sans">
          {/* Left Metadata: Location & Active Inference (Desktop only; collapses into mobile drawer below md) */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-400">
              <MapPin className="w-3 h-3 text-[#D4AF37]" />
              <span>Assam Basin (Duliajan HQ)</span>
            </div>

            <span className="text-slate-700">•</span>

            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-sans font-semibold">Inference Engine Active</span>
            </div>
          </div>

          {/* Right Metadata: Essential Clock only (Role badge moved to Tier 1) */}
          <div className="flex items-center justify-between w-full md:w-auto gap-2.5">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span suppressHydrationWarning>
                {timeString || (timeFormat === '12h' ? '8:00:00 AM IST' : '08:00:00 IST')}
              </span>
            </div>

            {/* 12H vs 24H Selector (Desktop only; in mobile drawer below sm) */}
            <div className="hidden sm:inline-flex items-center rounded bg-[#11182A] border border-[#1E293B] p-0.5 text-[10px] font-mono select-none">
              <button
                type="button"
                onClick={() => setTimeFormat('24h')}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  timeFormat === '24h'
                    ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Display timestamps in 24-Hour format"
              >
                24H
              </button>
              <button
                type="button"
                onClick={() => setTimeFormat('12h')}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  timeFormat === '12h'
                    ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Display timestamps in 12-Hour AM/PM format"
              >
                12H
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Navigation Drawer (Tier 1 Collapse) ─────────────── */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#1E293B] bg-[#0E1424] px-4 py-4 space-y-4 animate-fade-in shadow-2xl">
          {/* Mobile Navigation Links */}
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href || (link.href === '/dashboard' && pathname === '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-lg font-sans font-semibold text-sm transition-all min-h-[44px] ${
                    isActive
                      ? 'bg-[#1E293B] text-[#D4AF37] border border-[#D4AF37]/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-[#151D2E]'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Action Button on Mobile */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              openIngestionModal();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-sans font-semibold text-sm text-[#090D16] bg-[#D4AF37] hover:bg-[#F59E0B] active:scale-95 transition-all shadow-[0_0_12px_rgba(212,175,55,0.25)] cursor-pointer min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Field Report</span>
          </button>

          {/* Tier 2 Metadata Elements In Drawer */}
          <div className="pt-3 border-t border-[#1E293B] space-y-2 text-xs text-slate-400">
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Assam Basin (Duliajan HQ)</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">OPERATIONAL</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold">Inference Engine Active</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-500">ONLINE</span>
            </div>

            {/* Time Format Switcher on Mobile */}
            <div className="flex items-center justify-between py-2 border-t border-[#1E293B]/60">
              <span className="font-mono text-slate-400">Time Format:</span>
              <div className="inline-flex items-center rounded bg-[#11182A] border border-[#1E293B] p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setTimeFormat('24h')}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer min-h-[32px] ${
                    timeFormat === '24h'
                      ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  24H
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFormat('12h')}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer min-h-[32px] ${
                    timeFormat === '12h'
                      ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  12H AM/PM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
