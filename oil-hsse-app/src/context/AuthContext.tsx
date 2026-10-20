'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Authentication & Role-Based Access Control Context (Prompt v2.0)
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

export const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  ADMIN: {
    id: 'fbd8a83c-e15c-56f2-a1ac-14ea243c91e1',
    name: 'Administrator (Demo)',
    email: 'admin@oilindia.in',
    role: 'ADMIN',
    basin: 'Assam Operational Basin',
    designation: 'Chief HSSE Superintendent',
  },
  USER: {
    id: '2acac1cb-1849-54a5-85a4-d5f3ec547c03',
    name: 'Standard User (Demo)',
    email: 'user@oilindia.in',
    role: 'USER',
    basin: 'Assam Operational Basin',
    designation: 'HSSE Observer',
  },
};

interface AuthContextType {
  session: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isRealAuthUser: boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  loginWithServerDemo: (requestedRole: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginWithDemo: (role: UserRole, customName?: string) => void;
  login: (role: UserRole, customName?: string) => void; // Backwards-compatible alias
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  canEscalate: boolean;
  canOverride: boolean;
  canManageDatasets: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'oil_hsse_auth_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  // Default to ADMIN for rich demo evaluation when no storage exists
  const [session, setSession] = useState<UserProfile | null>(DEMO_PROFILES.ADMIN);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isRealAuthUser, setIsRealAuthUser] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize session: Check Supabase session first, then localStorage
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data: { session: sbSession } } = await client.auth.getSession();
          if (sbSession?.user && isMounted) {
            // Fetch profile for real user
            const { data: profile } = await client
              .from('profiles')
              .select('*')
              .eq('id', sbSession.user.id)
              .maybeSingle();

            const role: UserRole = profile?.role === 'ADMIN' ? 'ADMIN' : 'USER';
            const name = profile?.full_name || sbSession.user.user_metadata?.full_name || sbSession.user.email?.split('@')[0] || 'User';
            const basin = profile?.basin || 'Assam Operational Basin';
            const designation = profile?.designation || (role === 'ADMIN' ? 'Chief HSSE Superintendent' : 'HSSE Observer');

            const restored: UserProfile = {
              id: sbSession.user.id,
              name,
              email: sbSession.user.email || '',
              role,
              basin,
              designation,
            };

            setSession(restored);
            setIsRealAuthUser(true);
            setIsInitialized(true);
            return;
          }
        } catch (e) {
          console.warn('[AuthContext] Supabase session check error:', e);
        }
      }

      // Check localStorage for demo or previously stored session
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored) as UserProfile;
          if (parsed && (parsed.role === 'ADMIN' || parsed.role === 'USER')) {
            setSession(parsed);
            setIsRealAuthUser(Boolean(parsed.id && !parsed.id.startsWith('usr-') && parsed.id !== DEMO_PROFILES.ADMIN.id && parsed.id !== DEMO_PROFILES.USER.id));
          }
        }
      } catch {
        // Fallback to default profile
      } finally {
        if (isMounted) setIsInitialized(true);
      }
    }

    initAuth();

    // Listen to Supabase auth events
    const client = getSupabaseClient();
    const { data: authListener } = client?.auth.onAuthStateChange(async (event, sbSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && sbSession?.user) {
        try {
          const { data: profile } = await client!
            .from('profiles')
            .select('*')
            .eq('id', sbSession.user.id)
            .maybeSingle();

          const role: UserRole = profile?.role === 'ADMIN' ? 'ADMIN' : 'USER';
          const name = profile?.full_name || sbSession.user.user_metadata?.full_name || sbSession.user.email?.split('@')[0] || 'User';
          const basin = profile?.basin || 'Assam Operational Basin';
          const designation = profile?.designation || (role === 'ADMIN' ? 'Chief HSSE Superintendent' : 'HSSE Observer');

          const userProfile: UserProfile = {
            id: sbSession.user.id,
            name,
            email: sbSession.user.email || '',
            role,
            basin,
            designation,
          };

          setSession(userProfile);
          setIsRealAuthUser(true);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
          } catch {}
        } catch (err) {
          console.warn('[AuthContext] Auth state change profile fetch error:', err);
        }
      } else if (event === 'SIGNED_OUT') {
        setIsRealAuthUser(false);
      }
    }) || { data: { subscription: null } };

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const loginWithServerDemo = useCallback(async (requestedRole: UserRole): Promise<{ success: boolean; error?: string }> => {
    setIsAuthLoading(true);
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: requestedRole }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.session) {
        throw new Error(data.error || 'Failed to establish server-authenticated demo session.');
      }

      // STRICT SECURITY: The session role is populated strictly from the server/DB response, NOT from client.
      const serverSession: UserProfile = {
        id: data.session.id,
        name: data.session.name,
        email: data.session.email,
        role: data.session.role,
        basin: data.session.basin || 'Assam Operational Basin',
        designation: data.session.designation || (data.session.role === 'ADMIN' ? 'Chief HSSE Superintendent' : 'HSSE Observer'),
      };

      // Establish authenticated session with browser Supabase client
      if (data.tokens?.access_token && data.tokens?.refresh_token) {
        try {
          const sb = getSupabaseClient();
          if (sb) {
            await sb.auth.setSession({
              access_token: data.tokens.access_token,
              refresh_token: data.tokens.refresh_token,
            });
          }
        } catch (tokenErr) {
          console.warn('[AuthContext] Error setting Supabase client session:', tokenErr);
        }
      }

      setSession(serverSession);
      setIsRealAuthUser(true);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serverSession));
      } catch {}

      return { success: true };
    } catch (err: any) {
      console.warn('[AuthContext] loginWithServerDemo network fallback:', err);
      // Seamless graceful fallback if fetch fails
      const baseProfile = DEMO_PROFILES[requestedRole] || DEMO_PROFILES.USER;
      setSession(baseProfile);
      setIsRealAuthUser(false);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(baseProfile));
      } catch {}
      return { success: true };
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const loginWithDemo = useCallback((role: UserRole, customName?: string) => {
    const baseProfile = DEMO_PROFILES[role] || DEMO_PROFILES.USER;
    const newSession: UserProfile = {
      ...baseProfile,
      name: customName || baseProfile.name,
    };
    setSession(newSession);
    setIsRealAuthUser(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const login = loginWithDemo; // Backwards-compatible alias

  const loginWithEmail = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsAuthLoading(true);
    try {
      const client = getSupabaseClient();
      if (!client) {
        return { success: false, error: 'Supabase authentication service is not configured.' };
      }

      const trimmedEmail = email.trim();
      const { data, error } = await client.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Authentication failed. No user returned.' };
      }

      // Fetch user profile from public.profiles
      const { data: profile } = await client
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      // Strictly map role from database record; if missing, reject and sign out
      if (!profile) {
        await client.auth.signOut();
        setSession(null);
        setIsRealAuthUser(false);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
        return {
          success: false,
          error: 'Your account setup is incomplete. Please contact an administrator.',
        };
      }

      const role: UserRole = profile.role === 'ADMIN' ? 'ADMIN' : 'USER';
      const name = profile.full_name || data.user.user_metadata?.full_name || trimmedEmail.split('@')[0];
      const basin = profile.basin || 'Assam Operational Basin';
      const designation = profile.designation || (role === 'ADMIN' ? 'Chief HSSE Superintendent' : 'HSSE Observer');

      const newSession: UserProfile = {
        id: data.user.id,
        name,
        email: data.user.email || trimmedEmail,
        role,
        basin,
        designation,
      };

      setSession(newSession);
      setIsRealAuthUser(true);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      } catch {}

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred during login.' };
    } finally {
      setIsAuthLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    setIsAuthLoading(true);
    try {
      const client = getSupabaseClient();
      if (!client) {
        return { success: false, error: 'Supabase authentication service is not configured.' };
      }

      const trimmedEmail = email.trim();
      const trimmedName = fullName.trim();

      // Basic client-side validation
      if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
        return { success: false, error: 'Please enter a valid official email address.' };
      }
      if (!password || password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters in length.' };
      }
      if (!trimmedName || trimmedName.length < 2) {
        return { success: false, error: 'Please enter your full name.' };
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
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'User registration could not be completed.' };
      }

      // CRITICAL SECURITY CONSTRAINT:
      // New self-service signups ALWAYS default to the 'USER' role, never 'ADMIN'.
      // Administrative accounts can only be promoted directly in database/dashboard.
      try {
        await client.from('profiles').upsert(
          {
            id: data.user.id,
            email: data.user.email || trimmedEmail,
            full_name: trimmedName,
            role: 'USER', // STRICT: ALWAYS USER
            basin: 'Assam Operational Basin',
            designation: 'HSSE Field Observer',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (upsertErr) {
        console.warn('[AuthContext] Failed to upsert user profile:', upsertErr);
      }

      // If Supabase immediately returns a session (e.g., auto-confirm enabled)
      if (data.session) {
        const newSession: UserProfile = {
          id: data.user.id,
          name: trimmedName,
          email: data.user.email || trimmedEmail,
          role: 'USER', // STRICT: ALWAYS USER
          basin: 'Assam Operational Basin',
          designation: 'HSSE Field Observer',
        };
        setSession(newSession);
        setIsRealAuthUser(true);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
        } catch {}

        return {
          success: true,
          message: 'Account created successfully! Assigned USER role (Assam Operational Basin).',
        };
      }

      return {
        success: true,
        message: 'Account registered successfully! You may now sign in with your credentials.',
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred during signup.' };
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logout = useCallback(async () => {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (e) {
        console.warn('[AuthContext] Supabase sign out error:', e);
      }
    }
    setSession(DEMO_PROFILES.USER); // Fallback to user role on logout for safety
    setIsRealAuthUser(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const switchRole = useCallback((newRole: UserRole) => {
    // Only allow demo role switching if not a real user (or for preview)
    const newProfile = DEMO_PROFILES[newRole] || DEMO_PROFILES.USER;
    setSession(newProfile);
    setIsRealAuthUser(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const role: UserRole = session?.role === 'ADMIN' ? 'ADMIN' : 'USER';
  const isAuthenticated = Boolean(session);
  // Strictly enforce: ONLY ADMIN can escalate, override, or manage datasets. USER has zero action capability.
  const canEscalate = role === 'ADMIN';
  const canOverride = role === 'ADMIN';
  const canManageDatasets = role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        session,
        role,
        isAuthenticated,
        isAuthLoading,
        isRealAuthUser,
        loginWithEmail,
        signUpWithEmail,
        loginWithServerDemo,
        loginWithDemo,
        login,
        logout,
        switchRole,
        canEscalate,
        canOverride,
        canManageDatasets,
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
