// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Single-Source Public Environment Configuration & Validation
// - Reads all required public variables in one place
// - Zero localhost defaults in production; https-only in production
// - Never exposes variable values in errors or diagnostics
// ============================================================

export type PublicEnvVarName =
  | 'NEXT_PUBLIC_SUPABASE_URL'
  | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  | 'NEXT_PUBLIC_API_URL';

export interface EnvVarIssue {
  name: PublicEnvVarName;
  reason: 'missing' | 'must_use_https' | 'localhost_forbidden' | 'invalid_url';
  description: string;
}

export interface PublicEnvStatus {
  isValid: boolean;
  isProduction: boolean;
  supabaseUrlConfigured: boolean;
  supabaseAnonKeyConfigured: boolean;
  apiBaseUrlConfigured: boolean;
  missingVars: PublicEnvVarName[];
  invalidVars: EnvVarIssue[];
  allIssues: EnvVarIssue[];
}

export interface RawPublicEnv {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  NEXT_PUBLIC_API_URL: string;
}

/** Platform upload cap: 4 MB (safely below Vercel's 4.5 MB serverless request body limit). */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

function isPlaceholder(val: string): boolean {
  const lower = val.toLowerCase();
  return (
    lower.includes('your-project') ||
    lower.includes('your-supabase') ||
    lower.includes('your-backend') ||
    lower.includes('placeholder')
  );
}

function isLocalhostUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0';
  } catch {
    return url.toLowerCase().includes('localhost') || url.includes('127.0.0.1');
  }
}

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Pure validation function usable at both build time (next.config.ts) and runtime.
 * Never includes variable values in its output.
 */
export function validatePublicEnv(
  raw: RawPublicEnv,
  isProduction: boolean = process.env.NODE_ENV === 'production'
): PublicEnvStatus {
  const missingVars: PublicEnvVarName[] = [];
  const invalidVars: EnvVarIssue[] = [];

  const supaUrl = (raw.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const supaKey = (raw.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  const apiUrl = (raw.NEXT_PUBLIC_API_URL || '').trim();

  // 1. NEXT_PUBLIC_SUPABASE_URL
  let supabaseUrlConfigured = false;
  if (!supaUrl || isPlaceholder(supaUrl)) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  } else if (!isValidHttpUrl(supaUrl)) {
    invalidVars.push({
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      reason: 'invalid_url',
      description: 'Must be a valid URL.',
    });
  } else if (isProduction && isLocalhostUrl(supaUrl)) {
    invalidVars.push({
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      reason: 'localhost_forbidden',
      description: 'Cannot point to localhost in production.',
    });
  } else if (isProduction && !supaUrl.startsWith('https://')) {
    invalidVars.push({
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      reason: 'must_use_https',
      description: 'Must use https:// in production.',
    });
  } else {
    supabaseUrlConfigured = true;
  }

  // 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
  let supabaseAnonKeyConfigured = false;
  if (!supaKey || isPlaceholder(supaKey)) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  } else {
    supabaseAnonKeyConfigured = true;
  }

  // 3. NEXT_PUBLIC_API_URL
  let apiBaseUrlConfigured = false;
  if (!apiUrl || isPlaceholder(apiUrl)) {
    missingVars.push('NEXT_PUBLIC_API_URL');
  } else if (isProduction && isLocalhostUrl(apiUrl)) {
    invalidVars.push({
      name: 'NEXT_PUBLIC_API_URL',
      reason: 'localhost_forbidden',
      description: 'Cannot point to localhost in production.',
    });
  } else if (isProduction && !apiUrl.startsWith('https://')) {
    invalidVars.push({
      name: 'NEXT_PUBLIC_API_URL',
      reason: 'must_use_https',
      description: 'Must be a full https:// URL in production.',
    });
  } else if (!isValidHttpUrl(apiUrl)) {
    invalidVars.push({
      name: 'NEXT_PUBLIC_API_URL',
      reason: 'invalid_url',
      description: 'Must be a valid http:// or https:// URL.',
    });
  } else {
    apiBaseUrlConfigured = true;
  }

  const allIssues: EnvVarIssue[] = [
    ...missingVars.map((name) => ({
      name,
      reason: 'missing' as const,
      description: 'Required environment variable is not set.',
    })),
    ...invalidVars,
  ];

  return {
    isValid: allIssues.length === 0,
    isProduction,
    supabaseUrlConfigured,
    supabaseAnonKeyConfigured,
    apiBaseUrlConfigured,
    missingVars,
    invalidVars,
    allIssues,
  };
}

/**
 * Static literal access is mandatory so Next.js inlines NEXT_PUBLIC_* into client bundles.
 */
function readRawPublicEnv(): RawPublicEnv {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  };
}

export function getPublicEnvStatus(): PublicEnvStatus {
  return validatePublicEnv(readRawPublicEnv(), process.env.NODE_ENV === 'production');
}

export function getPublicEnvConfig(): {
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiBaseUrl: string;
  status: PublicEnvStatus;
} {
  const raw = readRawPublicEnv();
  const status = validatePublicEnv(raw, process.env.NODE_ENV === 'production');

  return {
    supabaseUrl: status.supabaseUrlConfigured ? raw.NEXT_PUBLIC_SUPABASE_URL.trim().replace(/\/+$/, '') : '',
    supabaseAnonKey: status.supabaseAnonKeyConfigured ? raw.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim() : '',
    apiBaseUrl: status.apiBaseUrlConfigured ? raw.NEXT_PUBLIC_API_URL.trim().replace(/\/+$/, '') : '',
    status,
  };
}

/**
 * Called during production builds (next.config.ts) to fail fast if any required
 * public variable is missing or invalid. Never logs values.
 */
export function assertValidProductionEnv(raw: RawPublicEnv = readRawPublicEnv()): void {
  const status = validatePublicEnv(raw, true);
  if (!status.isValid) {
    const lines = status.allIssues.map((issue) => `  - ${issue.name}: ${issue.description}`);
    throw new Error(
      [
        '',
        '========================================================================',
        'BUILD FAILED: Missing or invalid required public environment variables.',
        '========================================================================',
        ...lines,
        '',
        'Set these variables for Production & Preview in Vercel Project Settings',
        '(or your environment), then redeploy with build cache disabled.',
        '========================================================================',
        '',
      ].join('\n')
    );
  }
}
