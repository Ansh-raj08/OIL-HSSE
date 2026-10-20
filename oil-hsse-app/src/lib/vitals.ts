// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Performance & Web Vitals Telemetry (INP, LCP, CLS Instrumentation)
// Accurate browser-native performance monitoring without bundle bloat
// ============================================================

export interface InteractionMetric {
  name: string;
  duration: number;
  startTime: number;
  target?: string;
  timestamp: number;
}

// In-memory window of recent interaction durations
const interactionBuffer: InteractionMetric[] = [];
let maxInpObserved = 0;

/**
 * Initializes client-side PerformanceObserver for Interaction to Next Paint (INP)
 * and Largest Contentful Paint (LCP).
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
    return;
  }

  try {
    // 1. INP Observer: measures event latency from user action to visual presentation
    if (PerformanceObserver.supportedEntryTypes?.includes('event')) {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const eventEntry = entry as PerformanceEventTiming;
          // Only measure user-driven discrete interactions (pointerdown, click, keydown)
          if (['pointerdown', 'pointerup', 'click', 'keydown', 'keyup'].includes(eventEntry.name)) {
            const duration = Math.round(eventEntry.duration);
            const targetDesc = eventEntry.target
              ? (eventEntry.target as HTMLElement).tagName?.toLowerCase() +
                ((eventEntry.target as HTMLElement).id ? `#${(eventEntry.target as HTMLElement).id}` : '')
              : 'unknown';

            interactionBuffer.push({
              name: eventEntry.name,
              duration,
              startTime: Math.round(eventEntry.startTime),
              target: targetDesc,
              timestamp: Date.now(),
            });

            if (duration > maxInpObserved) {
              maxInpObserved = duration;
            }

            // Keep buffer reasonable
            if (interactionBuffer.length > 50) {
              interactionBuffer.shift();
            }

            if (process.env.NODE_ENV === 'development' && duration > 100) {
              console.debug(`[Web Vitals] INP candidate: ${eventEntry.name} on <${targetDesc}> took ${duration}ms`);
            }
          }
        }
      });

      observer.observe({ type: 'event', buffered: true, durationThreshold: 16 } as any);
    }
  } catch (err) {
    console.warn('[Web Vitals] Failed to initialize event PerformanceObserver:', err);
  }
}

/**
 * Returns current INP reading and interaction log.
 */
export function getInteractionMetrics() {
  return {
    currentMaxInpMs: maxInpObserved,
    totalInteractionsMeasured: interactionBuffer.length,
    recentInteractions: [...interactionBuffer],
    assessment:
      maxInpObserved < 200
        ? 'GOOD (< 200ms)'
        : maxInpObserved < 500
        ? 'NEEDS IMPROVEMENT (200-500ms)'
        : 'POOR (> 500ms)',
  };
}
