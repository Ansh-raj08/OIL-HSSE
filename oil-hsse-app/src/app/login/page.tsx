'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Single Unified Auth Form & Smooth Height Transitions
// v2.6.0 · PR2 (Master Prompt)
// - One persistent form (email and shared fields never unmount)
// - CSS grid-template-rows: 0fr -> 1fr animated collapse (260ms cubic-bezier)
// - Inactive fields marked inert & aria-hidden
// - Cross-fading titles, submit labels, and policy notices
// - Specific error code mapping with reference line
// - Resend confirmation email with 60s cooldown
// - Anchored card preventing vertical jump
// ============================================================

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import PublicShell from '@/components/PublicShell';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { ButtonSpinner } from '@/components/ui/Skeleton';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface AuthErrorInfo {
  message: string;
  code: string;
  isEmailNotConfirmed?: boolean;
}

// Map technical Supabase errors strictly by error_code with fallback
function parseAuthError(rawError: string, rawCode?: string, rawErrObj?: any): AuthErrorInfo {
  if (process.env.NODE_ENV !== 'production' && rawErrObj) {
    console.error('[Auth Error Object]', {
      name: rawErrObj?.name,
      message: rawErrObj?.message || rawError,
      code: rawErrObj?.code || rawCode,
      status: rawErrObj?.status,
    });
  }

  const code = (rawCode || '').toLowerCase();
  const lowerMsg = (rawError || '').toLowerCase();

  // 1. invalid_credentials
  if (
    code === 'invalid_credentials' ||
    code === 'invalid_grant' ||
    lowerMsg.includes('invalid login credentials') ||
    lowerMsg.includes('invalid_credentials')
  ) {
    return {
      message: 'Incorrect email or password.',
      code: 'invalid_credentials',
    };
  }

  // 2. email_not_confirmed
  if (
    code === 'email_not_confirmed' ||
    lowerMsg.includes('email not confirmed') ||
    lowerMsg.includes('email_not_confirmed')
  ) {
    return {
      message: 'Please confirm your email first. Check your inbox.',
      code: 'email_not_confirmed',
      isEmailNotConfirmed: true,
    };
  }

  // 3. Rate limited
  if (
    code === 'over_request_rate_limit' ||
    code === 'over_email_send_rate_limit' ||
    code.includes('rate_limit') ||
    lowerMsg.includes('too many requests') ||
    lowerMsg.includes('rate limit')
  ) {
    return {
      message: 'Too many attempts. Please wait a few minutes and try again.',
      code: code || 'over_request_rate_limit',
    };
  }

  // 4. user_banned
  if (
    code === 'user_banned' ||
    lowerMsg.includes('user is banned') ||
    lowerMsg.includes('user_banned')
  ) {
    return {
      message: 'This account is disabled.',
      code: 'user_banned',
    };
  }

  // 5. Account setup incomplete (No profiles row in public.profiles)
  if (
    code === 'account_setup_incomplete' ||
    lowerMsg.includes('account setup is incomplete')
  ) {
    return {
      message: 'Your account setup is incomplete. Please contact an administrator.',
      code: 'account_setup_incomplete',
    };
  }

  // 6. Network failure
  if (
    code === 'network_failure' ||
    lowerMsg.includes('failed to fetch') ||
    lowerMsg.includes('network') ||
    lowerMsg.includes('offline')
  ) {
    return {
      message: 'Could not reach the server. Check your connection.',
      code: 'network_failure',
    };
  }

  // 7. Fallback / anything else
  return {
    message: 'Sign-in failed. Please try again.',
    code: code || 'auth_error',
  };
}

// Safely extract and validate next redirect parameter (same-origin relative paths only)
function getSafeRedirectUrl(nextParam: string | null): string {
  if (!nextParam) return '/dashboard';
  const trimmed = nextParam.trim();
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.includes(':') &&
    !trimmed.includes('\\')
  ) {
    return trimmed;
  }
  return '/dashboard';
}

function LoginCardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isAuthenticated,
    session,
    loginWithEmail,
    signUpWithEmail,
    resendConfirmationEmail,
    setupIncomplete,
  } = useAuth();
  const toast = useToast();

  const targetRedirect = getSafeRedirectUrl(searchParams?.get('next') ?? null);

  // Mode state: 'signin' or 'signup'
  const initialMode = searchParams?.get('mode') === 'signup' ? 'signup' : 'signin';
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialMode);
  const isSignup = activeTab === 'signup';

  // Persistent Form Fields (Email is shared and never unmounts)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Error & Status State
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formError, setFormError] = useState<AuthErrorInfo | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<{ email: string; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resend Email Cooldown State
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Refs for element focus management
  const signinTabRef = useRef<HTMLButtonElement>(null);
  const signupTabRef = useRef<HTMLButtonElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Decrement resend cooldown timer every second
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Account setup incomplete notice
  useEffect(() => {
    if (setupIncomplete) {
      setFormError({
        message: 'Your account setup is incomplete. Please contact an administrator.',
        code: 'account_setup_incomplete',
      });
    }
  }, [setupIncomplete]);

  // If already authenticated, redirect straight to dashboard or target
  useEffect(() => {
    if (isAuthenticated && session) {
      router.replace(targetRedirect);
    }
  }, [isAuthenticated, session, router, targetRedirect]);

  // Handle browser back/forward buttons without full page reloads
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode') === 'signup' ? 'signup' : 'signin';
      setActiveTab(mode);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Smooth Tab Switch without routing interrupts
  const handleTabSwitch = (newTab: 'signin' | 'signup') => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);

    // Clear password inputs and alert banners on switch; retain email
    setPassword('');
    setConfirmPassword('');
    setFormError(null);
    setConfirmationNotice(null);
    setErrors({});
    setTouched({});

    // Update URL quietly without triggering route navigation or Suspense re-render
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newTab === 'signup') {
        url.searchParams.set('mode', 'signup');
      } else {
        url.searchParams.delete('mode');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Keyboard navigation for tablist
  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: 'signin' | 'signup') => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const nextTab = currentTab === 'signin' ? 'signup' : 'signin';
      handleTabSwitch(nextTab);
      if (nextTab === 'signin') {
        signinTabRef.current?.focus();
      } else {
        signupTabRef.current?.focus();
      }
    }
  };

  // Validation function
  const validateField = (field: string, value: string, currentPassword?: string): string => {
    const pwToCompare = currentPassword !== undefined ? currentPassword : password;
    if (field === 'email') {
      if (!value.trim()) return 'Official email address is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        return 'Please enter a valid official email address.';
      }
    }
    if (field === 'password') {
      if (!value) return 'Password is required.';
      if (value.length < 8) return 'Password must be at least 8 characters.';
    }
    if (field === 'confirmPassword' && isSignup) {
      if (!value) return 'Please confirm your password.';
      if (value !== pwToCompare) return "Passwords don't match";
    }
    if (field === 'fullName' && isSignup) {
      if (!value.trim()) return 'Full name is required for personnel records.';
      if (value.trim().length < 2) return 'Please enter your complete full name.';
    }
    return '';
  };

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Resend confirmation email handler
  const handleResendConfirmation = async () => {
    const targetEmail = confirmationNotice?.email || email.trim();
    if (!targetEmail || resendCooldown > 0 || isResending) return;
    setIsResending(true);
    const result = await resendConfirmationEmail(targetEmail);
    setIsResending(false);
    if (result.success) {
      toast.success('Confirmation Sent', `Verification email resent to ${targetEmail}.`);
      setResendCooldown(60);
    } else {
      const parsed = parseAuthError(result.error || '', result.code);
      toast.error('Resend Failed', parsed.message);
    }
  };

  // Submission handler for Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const emailErr = validateField('email', email);
    const passErr = validateField('password', password);

    setTouched({ email: true, password: true });
    setErrors({ email: emailErr, password: passErr });

    if (emailErr || passErr) {
      setFormError({
        message: 'Please resolve the errors highlighted below.',
        code: 'validation_failed',
      });
      if (emailErr && emailInputRef.current) {
        emailInputRef.current.focus();
      } else if (passErr && passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
      return;
    }

    setFormError(null);
    setConfirmationNotice(null);
    setIsSubmitting(true);

    const result = await loginWithEmail(email, password);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Signed in', 'Welcome to OIL HSSE Enterprise Decision-Support.');
      router.push(targetRedirect);
    } else {
      const parsed = parseAuthError(result.error || '', result.code, result.rawError);
      setFormError(parsed);
      toast.error('Sign In Failed', parsed.message);
    }
  };

  // Submission handler for Create Account
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const nameErr = validateField('fullName', fullName);
    const emailErr = validateField('email', email);
    const passErr = validateField('password', password);
    const confirmErr = validateField('confirmPassword', confirmPassword);

    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });
    setErrors({ fullName: nameErr, email: emailErr, password: passErr, confirmPassword: confirmErr });

    if (nameErr || emailErr || passErr || confirmErr) {
      setFormError({
        message: 'Please resolve the errors highlighted below.',
        code: 'validation_failed',
      });
      if (nameErr && nameInputRef.current) {
        nameInputRef.current.focus();
      } else if (emailErr && emailInputRef.current) {
        emailInputRef.current.focus();
      } else if (passErr && passwordInputRef.current) {
        passwordInputRef.current.focus();
      } else if (confirmErr && confirmPasswordInputRef.current) {
        confirmPasswordInputRef.current.focus();
      }
      return;
    }

    setFormError(null);
    setConfirmationNotice(null);
    setIsSubmitting(true);

    // CRITICAL: confirmPassword is purely client-validated and never sent to Supabase
    const result = await signUpWithEmail(email, password, fullName);
    setIsSubmitting(false);

    if (result.success) {
      if (result.hasSession) {
        // Confirmation is off in Supabase; user has a live session and enters immediately
        toast.success('Account created', 'Assigned standard User access role.');
        router.push(targetRedirect);
      } else {
        // Email confirmation is enabled in Supabase; show check email banner with resend
        setConfirmationNotice({
          email: email.trim(),
          message: `Check your email to confirm your account. A verification link has been sent to ${email.trim()}.`,
        });
        setResendCooldown(60);
      }
    } else {
      const parsed = parseAuthError(result.error || '', result.code, result.rawError);
      setFormError(parsed);
      toast.error('Registration Failed', parsed.message);
    }
  };

  return (
    <div className="w-full max-w-[440px] mx-auto">
      {/* ── Solid Slightly Lifted Surface Card ────────────────────── */}
      <div className="w-full rounded-[22px] border border-white/10 bg-[#141416] p-6 sm:p-8 shadow-2xl relative select-none">
        
        {/* Header Block: Crossfaded Title and Subtitle (260ms easing) */}
        <div className="mb-6 text-left relative min-h-[58px]">
          {/* Sign In Header */}
          <div
            className="absolute inset-x-0 top-0 transition-[opacity,transform] duration-[260ms] motion-reduce:transition-none"
            style={{
              opacity: isSignup ? 0 : 1,
              transform: isSignup ? 'translateY(-4px)' : 'translateY(0)',
              pointerEvents: isSignup ? 'none' : 'auto',
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            aria-hidden={isSignup}
          >
            <h1 className="text-2xl sm:text-[26px] font-semibold text-white tracking-tight">
              Sign in
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-normal">
              Access the SIF-Precursor Surveillance Console.
            </p>
          </div>

          {/* Create Account Header */}
          <div
            className="absolute inset-x-0 top-0 transition-[opacity,transform] duration-[260ms] motion-reduce:transition-none"
            style={{
              opacity: isSignup ? 1 : 0,
              transform: isSignup ? 'translateY(0)' : 'translateY(4px)',
              pointerEvents: isSignup ? 'auto' : 'none',
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            aria-hidden={!isSignup}
          >
            <h1 className="text-2xl sm:text-[26px] font-semibold text-white tracking-tight">
              Create your account
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-normal">
              Register for upstream safety access.
            </p>
          </div>
        </div>

        {/* ── Segmented Control with Uniform Inset and Indicator (Section 2 & 3) ── */}
        <div
          role="tablist"
          aria-label="Authentication Options"
          className="relative p-1 h-[48px] bg-black/40 rounded-[12px] border border-white/10 grid grid-cols-2 mb-6"
        >
          {/* Single Absolutely Positioned Indicator (4px uniform inset, 260ms transform synchronized) */}
          <div
            aria-hidden="true"
            style={{
              left: 4,
              top: 4,
              bottom: 4,
              width: 'calc((100% - 8px) / 2)',
              transform: activeTab === 'signin' ? 'translateX(0)' : 'translateX(100%)',
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className="absolute bg-[#242426] rounded-[8px] border border-white/10 transition-transform duration-[260ms] motion-reduce:transition-none pointer-events-none"
          />

          {/* Tab 1: Sign in */}
          <button
            ref={signinTabRef}
            type="button"
            role="tab"
            id="tab-signin"
            aria-selected={activeTab === 'signin'}
            aria-controls="auth-unified-form"
            tabIndex={activeTab === 'signin' ? 0 : -1}
            onClick={() => handleTabSwitch('signin')}
            onKeyDown={(e) => handleTabKeyDown(e, 'signin')}
            className={`relative z-10 h-full flex items-center justify-center text-[14px] sm:text-[15px] font-semibold rounded-[8px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141416] ${
              activeTab === 'signin'
                ? 'text-white'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            Sign in
          </button>

          {/* Tab 2: Create account */}
          <button
            ref={signupTabRef}
            type="button"
            role="tab"
            id="tab-signup"
            aria-selected={activeTab === 'signup'}
            aria-controls="auth-unified-form"
            tabIndex={activeTab === 'signup' ? 0 : -1}
            onClick={() => handleTabSwitch('signup')}
            onKeyDown={(e) => handleTabKeyDown(e, 'signup')}
            className={`relative z-10 h-full flex items-center justify-center text-[14px] sm:text-[15px] font-semibold rounded-[8px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141416] ${
              activeTab === 'signup'
                ? 'text-white'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            Create account
          </button>
        </div>

        {/* ── Animated Error Banner with Reference Code and Resend Button ── */}
        <div
          className="grid transition-[grid-template-rows,opacity] duration-[260ms] motion-reduce:transition-none"
          style={{
            gridTemplateRows: formError ? '1fr' : '0fr',
            opacity: formError ? 1 : 0,
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          inert={!formError ? true : undefined}
          aria-hidden={!formError}
        >
          <div className="overflow-hidden">
            {formError && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex flex-col gap-2"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div className="flex-1">
                    <p className="font-sans font-medium text-rose-200">{formError.message}</p>
                    <p className="font-mono text-[10px] text-rose-400/80 mt-1">
                      Reference: {formError.code}
                    </p>
                  </div>
                </div>

                {formError.isEmailNotConfirmed && (
                  <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400 font-sans">
                      Need another link?
                    </span>
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={resendCooldown > 0 || isResending}
                      className="text-[11px] font-semibold text-white underline hover:text-blue-300 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {isResending && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span>
                        {resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : isResending
                          ? 'Sending...'
                          : 'Resend email'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Animated Check Your Email Banner (Post Signup with Resend) ── */}
        <div
          className="grid transition-[grid-template-rows,opacity] duration-[260ms] motion-reduce:transition-none"
          style={{
            gridTemplateRows: confirmationNotice ? '1fr' : '0fr',
            opacity: confirmationNotice ? 1 : 0,
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          inert={!confirmationNotice ? true : undefined}
          aria-hidden={!confirmationNotice}
        >
          <div className="overflow-hidden">
            {confirmationNotice && (
              <div
                role="status"
                className="mb-5 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs flex flex-col gap-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                  <div className="flex-1">
                    <p className="font-semibold text-white font-sans text-xs">
                      Check your email to confirm your account
                    </p>
                    <p className="text-[11px] text-neutral-300 mt-1 leading-relaxed font-sans">
                      {confirmationNotice.message}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-500/20 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400 font-sans">Didn&apos;t receive it?</span>
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resendCooldown > 0 || isResending}
                    className="text-[11px] font-semibold text-white underline hover:text-blue-300 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {isResending && <RefreshCw className="w-3 h-3 animate-spin" />}
                    <span>
                      {resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : isResending
                        ? 'Sending...'
                        : 'Resend confirmation email'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── SINGLE UNIFIED FORM (Shared fields never unmount) ─────── */}
        <form
          id="auth-unified-form"
          onSubmit={isSignup ? handleSignUp : handleSignIn}
          noValidate
          className="space-y-4"
        >
          {/* 1. Full Name Field Wrapper (Animated Collapse: 0fr -> 1fr) */}
          <div
            className="grid transition-[grid-template-rows,opacity,transform] duration-[260ms] motion-reduce:transition-none"
            style={{
              gridTemplateRows: isSignup ? '1fr' : '0fr',
              opacity: isSignup ? 1 : 0,
              transform: isSignup ? 'translateY(0)' : 'translateY(-6px)',
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            inert={!isSignup ? true : undefined}
            aria-hidden={!isSignup}
          >
            <div className="overflow-hidden">
              <div className="pb-1">
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-medium text-neutral-300 mb-1.5"
                >
                  Full name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    ref={nameInputRef}
                    id="signup-name"
                    type="text"
                    name="fullName"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (touched.fullName) {
                        setErrors((prev) => ({
                          ...prev,
                          fullName: validateField('fullName', e.target.value),
                        }));
                      }
                    }}
                    onBlur={(e) => handleBlur('fullName', e.target.value)}
                    placeholder="Personnel full name"
                    aria-required={isSignup}
                    aria-invalid={Boolean(touched.fullName && errors.fullName)}
                    aria-describedby={
                      touched.fullName && errors.fullName ? 'signup-name-error' : undefined
                    }
                    className={`w-full min-h-[44px] pl-10 pr-3.5 rounded-xl bg-black/50 border text-xs text-white placeholder:text-neutral-500 outline-none transition-colors ${
                      touched.fullName && errors.fullName
                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500'
                        : 'border-white/10 focus:border-[#2997FF] focus:ring-2 focus:ring-[#2997FF]'
                    }`}
                  />
                </div>
                {touched.fullName && errors.fullName && (
                  <p id="signup-name-error" className="text-xs text-rose-400 mt-1 font-sans">
                    {errors.fullName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 2. Official Email Field (SHARED — Never unmounts, preserves typed value) */}
          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-medium text-neutral-300 mb-1.5"
            >
              Official email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                ref={emailInputRef}
                id="auth-email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched.email) {
                    setErrors((prev) => ({
                      ...prev,
                      email: validateField('email', e.target.value),
                    }));
                  }
                }}
                onBlur={(e) => handleBlur('email', e.target.value)}
                placeholder="name@example.com"
                aria-required="true"
                aria-invalid={Boolean(touched.email && errors.email)}
                aria-describedby={touched.email && errors.email ? 'auth-email-error' : undefined}
                className={`w-full min-h-[44px] pl-10 pr-3.5 rounded-xl bg-black/50 border text-xs text-white placeholder:text-neutral-500 outline-none transition-colors ${
                  touched.email && errors.email
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500'
                    : 'border-white/10 focus:border-[#2997FF] focus:ring-2 focus:ring-[#2997FF]'
                }`}
              />
            </div>
            {touched.email && errors.email && (
              <p id="auth-email-error" className="text-xs text-rose-400 mt-1 font-sans">
                {errors.email}
              </p>
            )}
          </div>

          {/* 3. Password Field (SHARED — Never unmounts) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="auth-password"
                className="block text-xs font-medium text-neutral-300"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="text-[11px] text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:underline"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                ref={passwordInputRef}
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => {
                  const newPass = e.target.value;
                  setPassword(newPass);
                  if (touched.password || touched.confirmPassword) {
                    setErrors((prev) => ({
                      ...prev,
                      ...(touched.password ? { password: validateField('password', newPass) } : {}),
                      ...(touched.confirmPassword && isSignup
                        ? { confirmPassword: validateField('confirmPassword', confirmPassword, newPass) }
                        : {}),
                    }));
                  }
                }}
                onBlur={(e) => handleBlur('password', e.target.value)}
                placeholder="At least 8 characters"
                aria-required="true"
                aria-invalid={Boolean(touched.password && errors.password)}
                aria-describedby={
                  touched.password && errors.password ? 'auth-password-error' : undefined
                }
                className={`w-full min-h-[44px] pl-10 pr-3.5 rounded-xl bg-black/50 border text-xs text-white placeholder:text-neutral-500 outline-none transition-colors ${
                  touched.password && errors.password
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500'
                    : 'border-white/10 focus:border-[#2997FF] focus:ring-2 focus:ring-[#2997FF]'
                }`}
              />
            </div>
            {touched.password && errors.password && (
              <p id="auth-password-error" className="text-xs text-rose-400 mt-1 font-sans">
                {errors.password}
              </p>
            )}
          </div>

          {/* 4. Confirm Password Field Wrapper (Animated Collapse: 0fr -> 1fr) */}
          <div
            className="grid transition-[grid-template-rows,opacity,transform] duration-[260ms] motion-reduce:transition-none"
            style={{
              gridTemplateRows: isSignup ? '1fr' : '0fr',
              opacity: isSignup ? 1 : 0,
              transform: isSignup ? 'translateY(0)' : 'translateY(-6px)',
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            inert={!isSignup ? true : undefined}
            aria-hidden={!isSignup}
          >
            <div className="overflow-hidden">
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="signup-confirm-password"
                    className="block text-xs font-medium text-neutral-300"
                  >
                    Confirm password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="text-[11px] text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:underline"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showConfirmPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    ref={confirmPasswordInputRef}
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConfirmPassword(val);
                      if (touched.confirmPassword) {
                        setErrors((prev) => ({
                          ...prev,
                          confirmPassword: validateField('confirmPassword', val),
                        }));
                      }
                    }}
                    onBlur={(e) => handleBlur('confirmPassword', e.target.value)}
                    placeholder="Re-enter your password"
                    aria-required={isSignup}
                    aria-invalid={Boolean(touched.confirmPassword && errors.confirmPassword)}
                    aria-describedby={
                      touched.confirmPassword && errors.confirmPassword
                        ? 'signup-confirm-password-error'
                        : undefined
                    }
                    className={`w-full min-h-[44px] pl-10 pr-3.5 rounded-xl bg-black/50 border text-xs text-white placeholder:text-neutral-500 outline-none transition-colors ${
                      touched.confirmPassword && errors.confirmPassword
                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500'
                        : 'border-white/10 focus:border-[#2997FF] focus:ring-2 focus:ring-[#2997FF]'
                    }`}
                  />
                </div>
                {touched.confirmPassword && errors.confirmPassword && (
                  <p id="signup-confirm-password-error" className="text-xs text-rose-400 mt-1 font-sans">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 5. Role Policy Notice Wrapper (Animated Collapse: 0fr -> 1fr) */}
          <div
            className="grid transition-[grid-template-rows,opacity,transform] duration-[260ms] motion-reduce:transition-none"
            style={{
              gridTemplateRows: isSignup ? '1fr' : '0fr',
              opacity: isSignup ? 1 : 0,
              transform: isSignup ? 'translateY(0)' : 'translateY(-4px)',
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            inert={!isSignup ? true : undefined}
            aria-hidden={!isSignup}
          >
            <div className="overflow-hidden">
              <p className="text-[11px] text-neutral-400 leading-relaxed pt-1">
                New accounts start with User access. An administrator can grant more.
              </p>
            </div>
          </div>

          {/* 6. Primary Submit Button: Crossfading Labels */}
          <div className="pt-2">
            <HoverBorderGradient
              as="button"
              type="submit"
              disabled={isSubmitting}
              animateOnHoverOnly={true}
              containerClassName="w-full rounded-full cursor-pointer select-none"
              className="w-full flex items-center justify-center py-2.5 px-6 rounded-full bg-white text-black font-semibold text-xs tracking-wide transition-opacity disabled:opacity-60"
            >
              <div className="relative h-5 w-full flex items-center justify-center">
                {/* Sign in Button Label */}
                <span
                  className="absolute transition-[opacity,transform] duration-[260ms] motion-reduce:transition-none font-semibold text-xs tracking-wide"
                  style={{
                    opacity: isSubmitting ? 0 : !isSignup ? 1 : 0,
                    transform: !isSignup ? 'scale(1)' : 'scale(0.95)',
                    pointerEvents: !isSignup && !isSubmitting ? 'auto' : 'none',
                    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                  aria-hidden={isSignup || isSubmitting}
                >
                  Sign in
                </span>

                {/* Create account Button Label */}
                <span
                  className="absolute transition-[opacity,transform] duration-[260ms] motion-reduce:transition-none font-semibold text-xs tracking-wide"
                  style={{
                    opacity: isSubmitting ? 0 : isSignup ? 1 : 0,
                    transform: isSignup ? 'scale(1)' : 'scale(0.95)',
                    pointerEvents: isSignup && !isSubmitting ? 'auto' : 'none',
                    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                  aria-hidden={!isSignup || isSubmitting}
                >
                  Create account
                </span>

                {/* Submitting Spinner */}
                {isSubmitting && (
                  <span className="flex items-center gap-2">
                    <ButtonSpinner className="w-4 h-4" />
                    <span>{isSignup ? 'Creating account...' : 'Signing in...'}</span>
                  </span>
                )}
              </div>
            </HoverBorderGradient>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <PublicShell mode="login">
      <Suspense
        fallback={
          <div className="w-full max-w-[440px] mx-auto rounded-[22px] border border-white/10 bg-[#141416] p-8 flex items-center justify-center min-h-[300px]">
            <div className="w-7 h-7 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          </div>
        }
      >
        <LoginCardContent />
      </Suspense>
    </PublicShell>
  );
}
