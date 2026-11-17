// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Supabase Client Helper (Single-Source Public Env Module)
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getPublicEnvConfig } from '@/config/env';

let clientInstance: SupabaseClient | null = null;
let cachedSignature: string = '';

/**
 * Checks whether Supabase public environment variables are validly configured.
 */
export function isSupabaseConfigured(): boolean {
  const { status } = getPublicEnvConfig();
  return status.supabaseUrlConfigured && status.supabaseAnonKeyConfigured;
}

/**
 * Gets or initializes the Supabase browser client using the centralized env module.
 * Returns null if Supabase environment variables are not configured.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const { supabaseUrl, supabaseAnonKey, status } = getPublicEnvConfig();
  if (!status.supabaseUrlConfigured || !status.supabaseAnonKeyConfigured) {
    return null;
  }

  const signature = `${supabaseUrl}::${supabaseAnonKey}`;
  if (!clientInstance || cachedSignature !== signature) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    cachedSignature = signature;
  }

  return clientInstance;
}

export const supabase = getSupabaseClient();
