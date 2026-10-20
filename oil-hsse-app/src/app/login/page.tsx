'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Rebuilt /login Authentication Experience (Master Prompt)
// Design Language: Aceternity Spotlight & Landing Page Aesthetics
// Neutral dark surface (#141416), hairline borders, 22px radius,
// pill submit control, transform-animated segmented tab, zero dead ends,
// server-evaluated demo accounts, and open-redirect protection.
// ============================================================

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { UserRole } from '@/types/safety';
import PublicShell from '@/components/PublicShell';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { ButtonSpinner } from '@/components/ui/Skeleton';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

// Map technical Supabase errors to plain, user-friendly messages
function mapAuthErrorMessage(rawError: string): string {
  const lower = rawError.toLowerCase();
  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid_grant') ||
    lower.includes('invalid_credentials')
  ) {
    return 'Incorrect email address or password. Please verify your details.';
  }
  if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
    return 'Your email address has not been confirmed yet. Please check your inbox for the confirmation link.';
  }
  if (lower.includes('user already registered') || lower.includes('user_already_exists')) {
    return 'An account with this email address already exists. Please sign in instead.';
  }
  if (
    lower.includes('too many requests') ||
    lower.includes('rate limit') ||
    lower.includes('over_request_rate_limit')
  ) {
    return 'Too many login attempts. Please wait a few moments before trying again.';
  }
  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('offline')) {
    return 'Unable to reach the authentication service. Please check your internet connection.';
  }
  if (lower.includes('password should be at least')) {
    return 'Passwords must be at least 8 characters in length.';
  }
  return 'Authentication could not be completed. Please check your credentials and try again.';
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
    isRealAuthUser,
    loginWithEmail,
    signUpWithEmail,
    loginWithServerDemo,
  } = useAuth();
  const toast = useToast();

  const targetRedirect = getSafeRedirectUrl(searchParams?.get('next') ?? null);

  // Tab State: 'signin' or 'signup'
  const initialMode = searchParams?.get('mode') === 'signup' ? 'signup' : 'signin';
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialMode);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validation State
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formAlert, setFormAlert] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Element Refs for Focusing the First Invalid Field
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Environment Demo Flag
  const isDemoEnabled =
    process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true' ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === '1';

  // If already authenticated, redirect straight to dashboard or target
  useEffect(() => {
    if (isAuthenticated && isRealAuthUser) {
      router.replace(targetRedirect);
    }
  }, [isAuthenticated, isRealAuthUser, router, targetRedirect]);

  // Sync tab with URL parameter changes
  useEffect(() => {
    const mode = searchParams?.get('mode');
    if (mode === 'signup' && activeTab !== 'signup') {
      setActiveTab('signup');
    } else if (mode !== 'signup' && activeTab !== 'signin') {
      setActiveTab('signin');
    }
  }, [searchParams]);

  const handleTabSwitch = (newTab: 'signin' | 'signup') => {
    setActiveTab(newTab);
    setFormAlert(null);
    setConfirmationNotice(null);
    setErrors({});
    setTouched({});
    const newUrl = newTab === 'signup' ? '/login?mode=signup' : '/login';
    router.replace(newUrl, { scroll: false });
  };

  const validateField = (field: string, value: string): string => {
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
    if (field === 'fullName' && activeTab === 'signup') {
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const emailErr = validateField('email', email);
    const passErr = validateField('password', password);

    setTouched({ email: true, password: true });
    setErrors({ email: emailErr, password: passErr });

    if (emailErr || passErr) {
      setFormAlert('Please resolve the errors highlighted below.');
      if (emailErr && emailInputRef.current) {
        emailInputRef.current.focus();
      } else if (passErr && passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
      return;
    }

    setFormAlert(null);
    setIsSubmitting(true);

    const result = await loginWithEmail(email, password);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Signed in', 'Welcome to OIL HSSE Enterprise Decision-Support.');
      router.push(targetRedirect);
    } else {
      const msg = mapAuthErrorMessage(result.error || '');
      setFormAlert(msg);
      toast.error('Sign In Failed', msg);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const nameErr = validateField('fullName', fullName);
    const emailErr = validateField('email', email);
    const passErr = validateField('password', password);

    setTouched({ fullName: true, email: true, password: true });
    setErrors({ fullName: nameErr, email: emailErr, password: passErr });

    if (nameErr || emailErr || passErr) {
      setFormAlert('Please resolve the errors highlighted below.');
      if (nameErr && nameInputRef.current) {
        nameInputRef.current.focus();
      } else if (emailErr && emailInputRef.current) {
        emailInputRef.current.focus();
      } else if (passErr && passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
      return;
    }

    setFormAlert(null);
    setIsSubmitting(true);

    const result = await signUpWithEmail(email, password, fullName);
    setIsSubmitting(false);

    if (result.success) {
      if (result.message && result.message.toLowerCase().includes('confirm')) {
        setConfirmationNotice(
          'A confirmation link has been sent to your email address. Please verify your email to activate your account.'
        );
      } else {
        toast.success('Account created', 'Assigned standard User access role.');
        router.push(targetRedirect);
      }
    } else {
      const msg = mapAuthErrorMessage(result.error || '');
      setFormAlert(msg);
      toast.error('Registration Failed', msg);
    }
  };

  const handleDemoLaunch = async (role: UserRole) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setFormAlert(null);

    const result = await loginWithServerDemo(role);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(
        'Demo session active',
        `Authenticated as ${role === 'ADMIN' ? 'Chief HSSE Superintendent' : 'HSSE Field Observer'}.`
      );
      router.push(targetRedirect);
    } else {
      setFormAlert(result.error || 'Failed to establish demo session.');
    }
  };

  return (
    <div className="w-full max-w-[440px] mx-auto">
      {/* ── Solid Slightly Lifted Surface Card ────────────────────── */}
      <div className="w-full rounded-[22px] border border-white/10 bg-[#141416] p-6 sm:p-8 shadow-2xl relative select-none">
        {/* Header Block: Heading (plain, 24-28px, weight 600) + Muted Subtitle */}
        <div className="mb-6 text-left">
          <h1 className="text-2xl sm:text-[26px] font-semibold text-white tracking-tight">
            {activeTab === 'signin' ? 'Sign in' : 'Create your account'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1.5 font-normal">
            {activeTab === 'signin'
              ? 'Access the SIF-Precursor Surveillance Console.'
              : 'Register for upstream field observation access.'}
          </p>
        </div>

        {/* ── Segmented Control with Sliding Indicator ────────────── */}
        <div
          role="tablist"
          aria-label="Authentication Options"
          className="relative p-1 bg-black/40 rounded-xl border border-white/10 grid grid-cols-2 mb-6"
        >
          {/* Sliding Indicator (Animated via transform) */}
          <div
            aria-hidden="true"
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#242426] rounded-lg shadow-xs border border-white/10 transition-transform duration-200 ease-out ${
              activeTab === 'signin' ? 'translate-x-0' : 'translate-x-[calc(100%+8px)]'
            }`}
          />

          {/* Tab 1: Sign in */}
          <button
            type="button"
            role="tab"
            id="tab-signin"
            aria-selected={activeTab === 'signin'}
            aria-controls="panel-signin"
            onClick={() => handleTabSwitch('signin')}
            className={`relative z-10 min-h-[38px] flex items-center justify-center py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'signin'
                ? 'text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Sign in
          </button>

          {/* Tab 2: Create account */}
          <button
            type="button"
            role="tab"
            id="tab-signup"
            aria-selected={activeTab === 'signup'}
            aria-controls="panel-signup"
            onClick={() => handleTabSwitch('signup')}
            className={`relative z-10 min-h-[38px] flex items-center justify-center py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'signup'
                ? 'text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Create account
          </button>
        </div>

        {/* ── Error / Alert Summary Banner ────────────────────────── */}
        {formAlert && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2.5 animate-fade-in"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{formAlert}</span>
          </div>
        )}

        {/* ── Email Confirmation Success Notice ───────────────────── */}
        {confirmationNotice && (
          <div
            role="status"
            className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 text-xs flex items-start gap-3 animate-fade-in"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-1">Check your email</span>
              <p className="leading-relaxed text-neutral-300">{confirmationNotice}</p>
            </div>
          </div>
        )}

        {/* ── Sign In Form ────────────────────────────────────────── */}
        {activeTab === 'signin' && (
          <form
            id="panel-signin"
            role="tabpanel"
            aria-labelledby="tab-signin"
            onSubmit={handleSignIn}
            noValidate
            className="space-y-4 text-left"
          >
            {/* Email Field */}
            <div>
              <label
                htmlFor="signin-email"
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
                  id="signin-email"
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
                  aria-describedby={
                    touched.email && errors.email ? 'signin-email-error' : undefined
                  }
                  className={`w-full min-h-[44px] pl-10 pr-3.5 rounded-xl bg-black/50 border text-xs text-white placeholder:text-neutral-500 outline-none transition-colors ${
                    touched.email && errors.email
                      ? 'border-rose-500 focus:ring-2 focus:ring-rose-500'
                      : 'border-white/10 focus:border-[#2997FF] focus:ring-2 focus:ring-[#2997FF]'
                  }`}
                />
              </div>
              {touched.email && errors.email && (
                <p id="signin-email-error" className="text-xs text-rose-400 mt-1 font-sans">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="signin-password"
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
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (touched.password) {
                      setErrors((prev) => ({
                        ...prev,
                        password: validateField('password', e.target.value),
                      }));
                    }
                  }}
                  onBlur={(e) => handleBlur('password', e.target.value)}
                  placeholder="At least 8 characters"
                  aria-required="true"
                  aria-invalid={Boolean(touched.password && errors.password)}
                  aria-describedby={
                    touched.password && errors.password ? 'signin-password-error' : undefined
                  }
                  className={`w-full min-h-[44px] pl-10 pr-3.5 rounded-xl bg-black/50 border text-xs text-white placeholder:text-neutral-500 outline-none transition-colors ${
                    touched.password && errors.password
                      ? 'border-rose-500 focus:ring-2 focus:ring-rose-500'
                      : 'border-white/10 focus:border-[#2997FF] focus:ring-2 focus:ring-[#2997FF]'
                  }`}
                />
              </div>
              {touched.password && errors.password && (
                <p id="signin-password-error" className="text-xs text-rose-400 mt-1 font-sans">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Primary Submit Button: Landing Pill Treatment */}
            <div className="pt-2">
              <HoverBorderGradient
                as="button"
                type="submit"
                disabled={isSubmitting}
                animateOnHoverOnly={true}
                containerClassName="w-full rounded-full cursor-pointer select-none"
                className="w-full flex items-center justify-center py-2.5 px-6 rounded-full bg-white text-black font-semibold text-xs tracking-wide transition-opacity disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <ButtonSpinner className="w-4 h-4" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <span>Sign in</span>
                )}
              </HoverBorderGradient>
            </div>
          </form>
        )}

        {/* ── Create Account Form ─────────────────────────────────── */}
        {activeTab === 'signup' && (
          <form
            id="panel-signup"
            role="tabpanel"
            aria-labelledby="tab-signup"
            onSubmit={handleSignUp}
            noValidate
            className="space-y-4 text-left"
          >
            {/* Full Name Field */}
            <div>
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
                  name="name"
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
                  placeholder="Firstname Lastname"
                  aria-required="true"
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

            {/* Email Field */}
            <div>
              <label
                htmlFor="signup-email"
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
                  id="signup-email"
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
                  aria-describedby={
                    touched.email && errors.email ? 'signup-email-error' : undefined
                  }
                  className={`w-full min-h-[44px] pl-10 pr-3.5 rounded-xl bg-black/50 border text-xs text-white placeholder:text-neutral-500 outline-none transition-colors ${
                    touched.email && errors.email
                      ? 'border-rose-500 focus:ring-2 focus:ring-rose-500'
                      : 'border-white/10 focus:border-[#2997FF] focus:ring-2 focus:ring-[#2997FF]'
                  }`}
                />
              </div>
              {touched.email && errors.email && (
                <p id="signup-email-error" className="text-xs text-rose-400 mt-1 font-sans">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="signup-password"
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
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (touched.password) {
                      setErrors((prev) => ({
                        ...prev,
                        password: validateField('password', e.target.value),
                      }));
                    }
                  }}
                  onBlur={(e) => handleBlur('password', e.target.value)}
                  placeholder="At least 8 characters"
                  aria-required="true"
                  aria-invalid={Boolean(touched.password && errors.password)}
                  aria-describedby={
                    touched.password && errors.password ? 'signup-password-error' : undefined
                  }
                  className={`w-full min-h-[44px] pl-10 pr-3.5 rounded-xl bg-black/50 border text-xs text-white placeholder:text-neutral-500 outline-none transition-colors ${
                    touched.password && errors.password
                      ? 'border-rose-500 focus:ring-2 focus:ring-rose-500'
                      : 'border-white/10 focus:border-[#2997FF] focus:ring-2 focus:ring-[#2997FF]'
                  }`}
                />
              </div>
              {touched.password && errors.password && (
                <p id="signup-password-error" className="text-xs text-rose-400 mt-1 font-sans">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Role Policy Notice */}
            <p className="text-[11px] text-neutral-400 leading-relaxed pt-1">
              New accounts start with User access. An administrator can grant more.
            </p>

            {/* Primary Submit Button: Landing Pill Treatment */}
            <div className="pt-2">
              <HoverBorderGradient
                as="button"
                type="submit"
                disabled={isSubmitting}
                animateOnHoverOnly={true}
                containerClassName="w-full rounded-full cursor-pointer select-none"
                className="w-full flex items-center justify-center py-2.5 px-6 rounded-full bg-white text-black font-semibold text-xs tracking-wide transition-opacity disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <ButtonSpinner className="w-4 h-4" />
                    <span>Creating account...</span>
                  </span>
                ) : (
                  <span>Create account</span>
                )}
              </HoverBorderGradient>
            </div>
          </form>
        )}

        {/* ── Demo Access (Shown Only If Demo Mode Flag & Credentials Exist) ─ */}
        {isDemoEnabled && (
          <div className="mt-6 pt-5 border-t border-white/10 text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-neutral-300">
                Evaluating this platform?
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                Server sessions
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDemoLaunch('ADMIN')}
                className="min-h-[40px] px-3 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-medium text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Demo Admin</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDemoLaunch('USER')}
                className="min-h-[40px] px-3 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <User className="w-3.5 h-3.5 text-neutral-400" />
                <span>Demo User</span>
              </button>
            </div>
          </div>
        )}
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
