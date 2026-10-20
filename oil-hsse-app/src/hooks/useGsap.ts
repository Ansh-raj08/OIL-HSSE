'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// GSAP Motion Hook — Restrained enterprise animation utilities
// Philosophy: immediate, purposeful, sub-500ms, never decorative
// ============================================================

import { useEffect, useRef } from 'react';

// Safe dynamic importer — loads gsap only on client
async function getGsap() {
  const { gsap } = await import('gsap');
  return gsap;
}

// Check for reduced motion preference
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animates a modal container into view using a controlled GSAP timeline.
 * Duration ≈ 320ms total. Respects prefers-reduced-motion.
 *
 * @param containerRef - ref to the outermost modal wrapper div
 * @param isOpen       - whether the modal should be visible
 * @param onDone       - optional callback after open animation completes
 */
export function useGsapModalReveal(
  containerRef: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
  onDone?: () => void
) {
  const tlRef = useRef<any>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (!isOpen) {
      // Kill any running timeline to avoid double-triggers
      tlRef.current?.kill();
      return;
    }

    if (prefersReducedMotion()) {
      // Immediately visible, no transition
      el.style.opacity = '1';
      el.style.transform = 'none';
      onDone?.();
      return;
    }

    tlRef.current?.kill();

    getGsap().then((gsap) => {
      const tl = gsap.timeline({ onComplete: onDone });
      tlRef.current = tl;

      // Modal shell fades in and rises slightly
      tl.fromTo(
        el,
        { opacity: 0, y: 14, scale: 0.975 },
        { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'power2.out' }
      );

      // Header section slides in
      const header = el.querySelector('[data-gsap-modal-header]');
      if (header) {
        tl.fromTo(
          header,
          { opacity: 0, y: -6 },
          { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' },
          '-=0.12'
        );
      }

      // Body sections stagger in
      const sections = el.querySelectorAll('[data-gsap-modal-section]');
      if (sections.length > 0) {
        tl.fromTo(
          sections,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.22, stagger: 0.04, ease: 'power2.out' },
          '-=0.1'
        );
      }
    });

    return () => {
      tlRef.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
}

/**
/**
 * Animates a numeric risk score from a lower start value to target.
 * Updates DOM node directly if RefObject is provided, avoiding React re-render storms.
 * Duration ≈ 400ms. Always lands exactly on target value.
 *
 * @param targetScore         - actual score from backend/incident (0–100)
 * @param isOpen              - whether the panel is currently open
 * @param targetRefOrCallback - ref to span or callback to update displayed number
 */
export function useGsapRiskScoreReveal(
  targetScore: number,
  isOpen: boolean,
  targetRefOrCallback: React.RefObject<HTMLElement | null> | ((value: number) => void)
) {
  const objRef = useRef({ value: 0 });
  const tlRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (prefersReducedMotion()) {
      if (typeof targetRefOrCallback === 'function') {
        targetRefOrCallback(targetScore);
      } else if (targetRefOrCallback.current) {
        targetRefOrCallback.current.textContent = String(targetScore);
      }
      return;
    }

    tlRef.current?.kill();

    // Start slightly below target so animation is visible but snappy
    const startValue = Math.max(0, targetScore - Math.floor(targetScore * 0.35));
    objRef.current.value = startValue;

    getGsap().then((gsap) => {
      tlRef.current = gsap.to(objRef.current, {
        value: targetScore,
        duration: 0.38,
        ease: 'power2.out',
        onUpdate() {
          const rounded = Math.round(objRef.current.value);
          if (typeof targetRefOrCallback === 'function') {
            targetRefOrCallback(rounded);
          } else if (targetRefOrCallback.current) {
            targetRefOrCallback.current.textContent = String(rounded);
          }
        },
        onComplete() {
          if (typeof targetRefOrCallback === 'function') {
            targetRefOrCallback(targetScore);
          } else if (targetRefOrCallback.current) {
            targetRefOrCallback.current.textContent = String(targetScore);
          }
        },
      });
    });

    return () => {
      tlRef.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, targetScore]);
}

/**
 * Animates a horizontal/vertical progress indicator through stages.
 * Used by IngestionModal to visualise the processing pipeline.
 *
 * @param stageContainerRef  - ref to the stage list container
 * @param activeIndex        - currently active stage index
 */
export function useGsapPipelineStage(
  stageContainerRef: React.RefObject<HTMLElement | null>,
  activeIndex: number
) {
  useEffect(() => {
    const container = stageContainerRef.current;
    if (!container) return;
    if (prefersReducedMotion()) return;

    const stages = container.querySelectorAll('[data-pipeline-stage]');
    if (!stages.length) return;

    getGsap().then((gsap) => {
      stages.forEach((stage, idx) => {
        const dot = stage.querySelector('[data-pipeline-dot]');
        const label = stage.querySelector('[data-pipeline-label]');

        if (idx < activeIndex) {
          // Completed — settled green
          gsap.to(dot, { scale: 0.85, opacity: 0.7, duration: 0.15, ease: 'power1.out' });
        } else if (idx === activeIndex) {
          // Active — pulse in
          gsap.fromTo(
            dot,
            { scale: 0.6, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.25, ease: 'power2.out' }
          );
          gsap.fromTo(
            label,
            { opacity: 0.4, x: -4 },
            { opacity: 1, x: 0, duration: 0.2, ease: 'power2.out' }
          );
        } else {
          // Upcoming — dim
          gsap.to(dot, { scale: 0.7, opacity: 0.3, duration: 0.15, ease: 'power1.out' });
        }
      });
    });
  }, [stageContainerRef, activeIndex]);
}

/**
 * Subtle entrance reveal for a list of items (triage stream entries).
 * Strictly guards against animation storms:
 * - If more than 6 new items are added, only the first 4 new rows animate;
 *   the rest appear immediately.
 * - Respects prefers-reduced-motion.
 *
 * @param listRef     - ref to the list container element
 * @param itemCount   - total number of items currently in the list
 * @param startOffset - skip animating items before this index (already rendered in prior batch)
 */
export function useGsapListReveal(
  listRef: React.RefObject<HTMLElement | null>,
  itemCount?: number,
  startOffset: number = 0
) {
  const prevCountRef = useRef(startOffset);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      prevCountRef.current = itemCount ?? 0;
      return;
    }

    const allItems = el.querySelectorAll('[data-gsap-list-item]');
    if (!allItems.length) return;

    // Only animate items beyond the previously rendered boundary
    const newItems = Array.from(allItems).slice(prevCountRef.current);
    prevCountRef.current = allItems.length;

    if (!newItems.length) return;

    // Guard against animation storm: cap at 4 animated rows; show the rest immediately
    const itemsToAnimate = newItems.slice(0, 4);
    const restItems = newItems.slice(4);

    restItems.forEach((item) => {
      (item as HTMLElement).style.opacity = '1';
      (item as HTMLElement).style.transform = 'none';
    });

    getGsap().then((gsap) => {
      gsap.fromTo(
        itemsToAnimate,
        { opacity: 0, y: 8 },
        {
          opacity: 1,
          y: 0,
          duration: 0.18,
          stagger: 0.03,
          ease: 'power2.out',
          clearProps: 'opacity,transform',
        }
      );
    });
  }, [listRef, itemCount]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Animates a single newly-added incident row (e.g. from manual single-entry log).
 * Ensures smooth entrance without re-animating the rest of the list.
 */
export function useGsapNewItemReveal(itemRef: React.RefObject<HTMLElement | null>, isNew: boolean) {
  useEffect(() => {
    if (!isNew) return;
    const el = itemRef.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    getGsap().then((gsap) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: -12, scale: 0.98, borderColor: 'rgba(212, 175, 55, 0.8)' },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.35,
          ease: 'power2.out',
          borderColor: 'rgba(30, 41, 59, 1)',
        }
      );
    });
  }, [itemRef, isNew]);
}


/**
 * Animate a KPI number when its value genuinely changes.
 * Only fires on actual value changes, not on every render.
 *
 * @param containerRef - ref to the element containing the number span
 * @param value        - the real metric value
 * @param selector     - querySelector string for the span inside containerRef
 */
export function useGsapKpiUpdate(
  containerRef: React.RefObject<HTMLElement | null>,
  value: number,
  selector: string
) {
  const prevRef = useRef<number | null>(null);
  const tlRef = useRef<any>(null);

  useEffect(() => {
    if (prevRef.current === null) {
      // First render — just set value, no animation
      prevRef.current = value;
      return;
    }

    if (prevRef.current === value) return; // No change, skip

    const el = containerRef.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      prevRef.current = value;
      return;
    }

    const span = el.querySelector(selector) as HTMLElement | null;
    if (!span) { prevRef.current = value; return; }

    tlRef.current?.kill();

    const startVal = prevRef.current;
    prevRef.current = value;
    const obj = { v: startVal };

    getGsap().then((gsap) => {
      tlRef.current = gsap.to(obj, {
        v: value,
        duration: 0.4,
        ease: 'power2.out',
        onUpdate() {
          span.textContent = Math.round(obj.v).toLocaleString();
        },
        onComplete() {
          span.textContent = value.toLocaleString();
        },
      });
    });

    return () => { tlRef.current?.kill(); };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
}
