'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Global Time Format Context: 24-hour vs 12-hour AM/PM Toggle
// (Prompt v2.2 - Item 5)
// ============================================================

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type TimeFormat = '24h' | '12h';

interface TimeFormatContextType {
  timeFormat: TimeFormat;
  toggleTimeFormat: () => void;
  setTimeFormat: (format: TimeFormat) => void;
  formatTimestamp: (timestampStr: string) => string;
  isHydrated: boolean;
}

const STORAGE_KEY = 'oil_hsse_time_format';

export function convertTimestampDisplay(timestampStr: string, format: TimeFormat): string {
  if (!timestampStr) return '';

  // Check if string already contains 12h format (e.g. "8:35 AM" or "10:40 PM")
  const is12hRegex = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)\b/i;
  // Check if string contains 24h format (e.g. "08:35" or "22:40:00")
  const is24hRegex = /\b([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?\b/;

  const match12 = timestampStr.match(is12hRegex);
  if (match12) {
    if (format === '12h') return timestampStr;
    // Convert 12h -> 24h
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2];
    const seconds = match12[3];
    const meridiem = match12[4].toUpperCase();

    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    const hh = String(hours).padStart(2, '0');
    const timeReplacement = seconds ? `${hh}:${minutes}:${seconds}` : `${hh}:${minutes}`;
    return timestampStr.replace(match12[0], timeReplacement);
  }

  const match24 = timestampStr.match(is24hRegex);
  if (match24) {
    if (format === '24h') return timestampStr;
    // Convert 24h -> 12h
    const hours24 = parseInt(match24[1], 10);
    const minutes = match24[2];
    const seconds = match24[3];

    const meridiem = hours24 >= 12 ? 'PM' : 'AM';
    let hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;

    const timeReplacement = seconds
      ? `${hours12}:${minutes}:${seconds} ${meridiem}`
      : `${hours12}:${minutes} ${meridiem}`;

    return timestampStr.replace(match24[0], timeReplacement);
  }

  return timestampStr;
}

const TimeFormatContext = createContext<TimeFormatContextType | undefined>(undefined);

export function TimeFormatProvider({ children }: { children: ReactNode }) {
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>('24h');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as TimeFormat | null;
      if (saved === '12h' || saved === '24h') {
        setTimeFormatState(saved);
      }
    } catch {
      // localStorage may not be accessible in all environments
    }
  }, []);

  const setTimeFormat = useCallback((format: TimeFormat) => {
    setTimeFormatState(format);
    try {
      localStorage.setItem(STORAGE_KEY, format);
    } catch {
      // ignore
    }
  }, []);

  const toggleTimeFormat = useCallback(() => {
    setTimeFormatState((prev) => {
      const next = prev === '24h' ? '12h' : '24h';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const formatTimestamp = useCallback(
    (timestampStr: string) => convertTimestampDisplay(timestampStr, timeFormat),
    [timeFormat]
  );

  return (
    <TimeFormatContext.Provider
      value={{
        timeFormat,
        toggleTimeFormat,
        setTimeFormat,
        formatTimestamp,
        isHydrated,
      }}
    >
      {children}
    </TimeFormatContext.Provider>
  );
}

export function useTimeFormat() {
  const context = useContext(TimeFormatContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      timeFormat: '24h' as TimeFormat,
      toggleTimeFormat: () => {},
      setTimeFormat: () => {},
      formatTimestamp: (s: string) => s,
      isHydrated: false,
    };
  }
  return context;
}
