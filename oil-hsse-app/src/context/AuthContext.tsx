'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Authentication & Role-Based Access Control Context (v2.6.0 · PR2)
// Strict State Machine: loading -> unauthenticated | authenticated
// Zero Fallbacks, Zero Demo Sessions, Pure Supabase Database Roles
// ============================================================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { UserRole, AuthSession } from '@/types/safety';
import { getSupabaseClient } from '@/lib/supabase/client';

export interface UserProfile extends AuthSession {
  email: string;
  designation: string;
}

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated';

interface AuthContextType {
  session: UserProfile | null;
  role: UserRole | null;
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  canEscalate: boolean;
  canOverride: boolean;
  canManageDatasets: boolean;
  setupIncomplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Legacy storage keys from previous demo/offline attempts that must be purged
const LEGACY_STORAGE_KEYS = [
  'oil_hsse_auth_session',
  'oil_hsse_demo_role',
  'oil_hsse_user_role',
  'demo_session',
  'user_role',
  'auth_session',
];

function purgeLegacyStorage() {
  if (typeof window === 'undefined') return;
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore storage access errors
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Strict initial state: Starts at null with loading true
  const [session, setSession] = useState<UserProfile | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [setupIncomplete, setSetupIncomplete] = useState<boolean>(false);

  // Helper to fetch user profile strictly from public.profiles
  const fetchProfile = useCallback(async (userId: string, userEmail: string): Promise<UserProfile | null> => {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const { data: profile, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !profile) {
        console.warn('[AuthContext] Profile row unreadable or missing for authenticated user:', error);
        return null;
      }

      // Role must strictly be ADMIN or USER
      const dbRole: UserRole = profile.role === 'ADMIN' ? 'ADMIN' : profile.role === 'USER' ? 'USER' : 'USER';
      const name = profile.full_name || profile.email?.split('@')[0] || userEmail.split('@')[0] || 'User';
      const basin = profile.basin || 'Assam Operational Basin';
      const designation = profile.designation || (dbRole === 'ADMIN' ? 'Chief HSSE Superintendent' : 'Safety Officer');

      return {
        id: userId,
        name,
        email: userEmail || profile.email || '',
        role: dbRole,
        basin,
        designation,
      };
    } catch (err) {
      console.warn('[AuthContext] Exception fetching profile from database:', err);
      return null;
    }
  }, []);

  // Initialize session on startup
  useEffect(() => {
    let isMounted = true;
    purgeLegacyStorage();

    async function initAuth() {
      const client = getSupabaseClient();
      if (!client) {
        if (isMounted) {
          setSession(null);
          setAuthStatus('unauthenticated');
        }
        return;
      }

      try {
        const { data: { session: sbSession }, error: sessionError } = await client.auth.getSession();
        if (sessionError || !sbSession?.user) {
          if (isMounted) {
            setSession(null);
            setAuthStatus('unauthenticated');
          }
          return;
        }

        // Validate user against auth server (equivalent to getUser)
        const { data: userData, error: userError } = await client.auth.getUser();
        if (userError || !userData?.user) {
          await client.auth.signOut();
          if (isMounted) {
            setSession(null);
            setAuthStatus('unauthenticated');
          }
          return;
        }

        const profile = await fetchProfile(userData.user.id, userData.user.email || '');
        if (!profile) {
          // If there is an active session but the profile row is missing, refuse entry
          console.warn('[AuthContext] User has valid auth session but no database profile. Signing out.');
          await client.auth.signOut();
          if (isMounted) {
            setSetupIncomplete(true);
            setSession(null);
            setAuthStatus('unauthenticated');
          }
          return;
        }

        if (isMounted) {
          setSession(profile);
          setAuthStatus('authenticated');
          setSetupIncomplete(false);
        }
      } catch (err) {
        console.warn('[AuthContext] Auth initialization failed:', err);
        if (isMounted) {
          setSession(null);
          setAuthStatus('unauthenticated');
        }
      }
    }

    initAuth();

    // Listen to Supabase auth events (cross-tab sync, token expiration, sign-out)
    const client = getSupabaseClient();
    const { data: authListener } = client?.auth.onAuthStateChange(async (event, sbSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !sbSession?.user) {
        setSession(null);
        setAuthStatus('unauthenticated');
        purgeLegacyStorage();
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        const profile = await fetchProfile(sbSession.user.id, sbSession.user.email || '');
        if (!profile) {
          await client?.auth.signOut();
          setSetupIncomplete(true);
          setSession(null);
          setAuthStatus('unauthenticated');
        } else {
          setSession(profile);
          setAuthStatus('authenticated');
          setSetupIncomplete(false);
        }
      }
    }) || { data: { subscription: null } };

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const loginWithEmail = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setAuthStatus('loading');
    setSetupIncomplete(false);
    try {
      const client = getSupabaseClient();
      if (!client) {
        setAuthStatus('unauthenticated');
        return { success: false, error: 'Authentication service is currently unavailable.' };
      }

      const trimmedEmail = email.trim();
      const { data, error } = await client.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        setSession(null);
        setAuthStatus('unauthenticated');
        return { success: false, error: error.message };
      }

      if (!data.user) {
        setSession(null);
        setAuthStatus('unauthenticated');
        return { success: false, error: 'Authentication failed. No user record returned.' };
      }

      // Fetch user profile strictly from public.profiles
      const profile = await fetchProfile(data.user.id, data.user.email || trimmedEmail);
      if (!profile) {
        await client.auth.signOut();
        setSession(null);
        setAuthStatus('unauthenticated');
        setSetupIncomplete(true);
        return {
          success: false,
          error: 'Your account setup is incomplete. Please contact an administrator.',
        };
      }

      setSession(profile);
      setAuthStatus('authenticated');
      purgeLegacyStorage();
      return { success: true };
    } catch (err: any) {
      setSession(null);
      setAuthStatus('unauthenticated');
      return { success: false, error: err.message || 'An unexpected error occurred during login.' };
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    setAuthStatus('loading');
    try {
      const client = getSupabaseClient();
      if (!client) {
        setAuthStatus('unauthenticated');
        return { success: false, error: 'Authentication service is currently unavailable.' };
      }

      const trimmedEmail = email.trim();
      const trimmedName = fullName.trim();

      if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
        setAuthStatus('unauthenticated');
        return { success: false, error: 'Please enter a valid official email address.' };
      }
      if (!password || password.length < 8) {
        setAuthStatus('unauthenticated');
        return { success: false, error: 'Password must be at least 8 characters in length.' };
      }
      if (!trimmedName || trimmedName.length < 2) {
        setAuthStatus('unauthenticated');
        return { success: false, error: 'Please enter your complete full name.' };
      }

      const { data, error } = await client.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
          },
        },
      });

      if (error) {
        setAuthStatus('unauthenticated');
        return { success: false, error: error.message };
      }

      if (!data.user) {
        setAuthStatus('unauthenticated');
        return { success: false, error: 'User registration could not be completed.' };
      }

      // Security Constraint: New self-service signups ALWAYS receive the 'USER' role
      try {
        await client.from('profiles').upsert(
          {
            id: data.user.id,
            email: data.user.email || trimmedEmail,
            full_name: trimmedName,
            role: 'USER', // STRICT: ALWAYS USER
            basin: 'Assam Operational Basin',
            designation: 'Safety Officer',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (upsertErr) {
        console.warn('[AuthContext] Failed to upsert user profile:', upsertErr);
      }

      // If auto-confirm is enabled and a session is immediately issued
      if (data.session) {
        const profile = await fetchProfile(data.user.id, data.user.email || trimmedEmail);
        if (profile) {
          setSession(profile);
          setAuthStatus('authenticated');
          purgeLegacyStorage();
          return {
            success: true,
            message: 'Account created successfully! Assigned User access.',
          };
        }
      }

      setAuthStatus('unauthenticated');
      return {
        success: true,
        message: 'Account registered successfully! You may now sign in with your credentials.',
      };
    } catch (err: any) {
      setAuthStatus('unauthenticated');
      return { success: false, error: err.message || 'An unexpected error occurred during signup.' };
    }
  };

  const logout = useCallback(async () => {
    setAuthStatus('loading');
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (e) {
        console.warn('[AuthContext] Supabase sign out error:', e);
      }
    }
    setSession(null);
    setAuthStatus('unauthenticated');
    purgeLegacyStorage();
  }, []);

  const role: UserRole | null = session ? session.role : null;
  const isAuthenticated = authStatus === 'authenticated' && session !== null;
  const isAuthLoading = authStatus === 'loading';

  // Strictly enforce: ONLY ADMIN can escalate, override, or manage datasets. USER has zero action capability.
  const canEscalate = role === 'ADMIN';
  const canOverride = role === 'ADMIN';
  const canManageDatasets = role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        session,
        role,
        authStatus,
        isAuthenticated,
        isAuthLoading,
        loginWithEmail,
        signUpWithEmail,
        logout,
        canEscalate,
        canOverride,
        canManageDatasets,
        setupIncomplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
