'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Enterprise Theme System (Light / Dark Mode Provider)
// Supports document.startViewTransition() and scoped fallback class
// ============================================================

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'oil_hsse_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Synchronize with DOM state set by <head> blocking script
  useEffect(() => {
    setMounted(true);
    try {
      const isHtmlDark = document.documentElement.classList.contains('dark');
      const isHtmlLight = document.documentElement.classList.contains('light');
      if (isHtmlLight && !isHtmlDark) {
        setThemeState('light');
      } else {
        setThemeState('dark');
      }

      // Listen for system OS changes if user has no stored preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemChange = (e: MediaQueryListEvent) => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
          const next = e.matches ? 'dark' : 'light';
          applyThemeClasses(next);
          setThemeState(next);
        }
      };

      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    } catch {
      // ignore
    }
  }, []);

  const applyThemeClasses = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  };

  const executeTransition = useCallback((nextTheme: Theme) => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. If user prefers reduced motion, switch immediately without transition
    if (prefersReducedMotion) {
      applyThemeClasses(nextTheme);
      setThemeState(nextTheme);
      return;
    }

    // 2. Preferred: document.startViewTransition crossfade
    if ('startViewTransition' in document && typeof (document as any).startViewTransition === 'function') {
      (document as any).startViewTransition(() => {
        applyThemeClasses(nextTheme);
        setThemeState(nextTheme);
      });
      return;
    }

    // 3. Fallback: scoped .theme-transition class for 280ms
    document.documentElement.classList.add('theme-transition');
    applyThemeClasses(nextTheme);
    setThemeState(nextTheme);

    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 280);
  }, []);

  const setTheme = useCallback((nextTheme: Theme) => {
    executeTransition(nextTheme);
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // ignore
    }
  }, [executeTransition]);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      executeTransition(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, [executeTransition]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
