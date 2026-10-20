'use client';

import { useEffect } from 'react';
import { initPerformanceMonitoring, getInteractionMetrics } from '@/lib/vitals';

export default function PerformanceTelemetry() {
  useEffect(() => {
    initPerformanceMonitoring();

    if (typeof window !== 'undefined') {
      (window as any).__OIL_INP_METRICS__ = getInteractionMetrics;
    }
  }, []);

  return null;
}
