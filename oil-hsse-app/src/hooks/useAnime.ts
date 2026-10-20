'use client';

import { useEffect, useRef, useCallback } from 'react';

// ── Counter Roll-Up ──────────────────────────────────────────
export function useCounterAnimation(
  selector: string,
  targetValue: number,
  duration: number = 2000,
  decimals: number = 0
) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return;

    const obj = { value: 0 };
    import('animejs').then(({ animate }) => {
      animate(obj, {
        value: targetValue,
        duration,
        ease: 'outExpo',
        onUpdate() {
          el.textContent = decimals > 0
            ? obj.value.toFixed(decimals)
            : Math.floor(obj.value).toLocaleString();
        },
      });
    });
  }, [selector, targetValue, duration, decimals]);
}

// ── Radar Pulse Loop ─────────────────────────────────────────
export function useRadarPulse(selector: string) {
  useEffect(() => {
    let stopped = false;
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;

    // Stagger repeated pulse using CSS animation fallback since anime v4 loop API changed
    elements.forEach((el, i) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.animation = `radar-pulse 1.8s ease-out ${i * 0.3}s infinite`;
    });

    return () => {
      if (stopped) return;
      stopped = true;
      elements.forEach((el) => {
        (el as HTMLElement).style.animation = '';
      });
    };
  }, [selector]);
}

// ── HUD Scan-Line Reveal ─────────────────────────────────────
export function useHudReveal(selector: string, delay: number = 0) {
  useEffect(() => {
    const elements = document.querySelectorAll(selector);
    import('animejs').then(({ animate, utils }) => {
      animate(elements, {
        opacity: [0, 1],
        translateY: [-8, 0],
        duration: 600,
        delay: utils.stagger(80, { start: delay }),
        ease: 'outQuad',
      });
    });
  }, [selector, delay]);
}

// ── Fade-In Scale ────────────────────────────────────────────
export function useFadeInScale(selector: string, delay: number = 0) {
  useEffect(() => {
    const elements = document.querySelectorAll(selector);
    import('animejs').then(({ animate, utils }) => {
      animate(elements, {
        opacity: [0, 1],
        scale: [0.92, 1],
        duration: 500,
        delay: utils.stagger(60, { start: delay }),
        ease: 'outBack(1.7)',
      });
    });
  }, [selector, delay]);
}

// ── Drawer Slide-In ──────────────────────────────────────────
export function useDrawerSlide(selector: string, isOpen: boolean) {
  useEffect(() => {
    const el = document.querySelector(selector);
    if (!el) return;
    import('animejs').then(({ animate }) => {
      animate(el, {
        translateX: isOpen ? ['100%', '0%'] : ['0%', '100%'],
        duration: 380,
        ease: isOpen ? 'outExpo' : 'inExpo',
      });
    });
  }, [selector, isOpen]);
}

// ── Number Ticker (callback-based) ───────────────────────────
export function useNumberTicker(
  value: number,
  onUpdate: (v: number) => void,
  duration: number = 2000
) {
  const hasRun = useRef(false);
  const stableCb = useCallback(onUpdate, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const obj = { value: 0 };
    import('animejs').then(({ animate }) => {
      animate(obj, {
        value,
        duration,
        ease: 'outExpo',
        onUpdate() { stableCb(obj.value); },
      });
    });
  }, [value, duration, stableCb]);
}
