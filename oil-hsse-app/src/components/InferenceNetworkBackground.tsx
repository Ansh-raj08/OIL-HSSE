'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Three.js Inference Network Background — Dashboard Only
//
// Philosophy:
//   20–35 nodes, thin connection lines, very slow drift.
//   OIL Gold accent, dark neutral palette.
//   Purely decorative — pointer-events: none.
//   Cleans up renderer + geometries on unmount.
//   Pauses when tab is not visible.
//   Respects prefers-reduced-motion.
// ============================================================

import React, { useEffect, useRef, useState } from 'react';

interface Node3D {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const NODE_COUNT = 28;
const MAX_LINK_DISTANCE = 200; // px — only draw lines within this range
const MAX_LINKS_PER_NODE = 3;  // limit line density

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isMobileOrTouchPrimary(): boolean {
  if (typeof window === 'undefined') return false;
  const isNarrow = window.innerWidth < 768;
  const isTouchPrimary =
    window.matchMedia('(pointer: coarse)').matches ||
    (typeof navigator !== 'undefined' && (navigator.maxTouchPoints || 0) > 0);
  return isNarrow || isTouchPrimary;
}

export default function InferenceNetworkBackground() {
  const [canMount, setCanMount] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const nodesRef = useRef<Node3D[]>([]);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (!isMobileOrTouchPrimary()) {
      setCanMount(true);
    }
  }, []);

  useEffect(() => {
    if (!canMount) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Respect reduced motion — render a completely static, nearly-invisible field
    const reduced = prefersReducedMotion();

    // Sizing
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resizeCanvas();

    // Initialise nodes with random position and very slow velocity
    const initNodes = () => {
      nodesRef.current = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * (reduced ? 0 : 0.15),
        vy: (Math.random() - 0.5) * (reduced ? 0 : 0.12),
      }));
    };
    initNodes();

    // Colors — tuned to be very subtle against #090D16 background
    const NODE_COLOR_DIM = 'rgba(148, 163, 184, 0.18)';      // slate dim
    const NODE_COLOR_GOLD = 'rgba(212, 175, 55, 0.55)';       // OIL Gold accent (~15% of nodes)
    const LINE_COLOR_BASE = 'rgba(100, 116, 139, 0.10)';      // very faint slate
    const LINE_COLOR_GOLD = 'rgba(212, 175, 55, 0.10)';       // gold line accent

    // Mark ~15% of nodes as accent nodes
    const accentIndices = new Set<number>();
    while (accentIndices.size < Math.floor(NODE_COUNT * 0.15)) {
      accentIndices.add(Math.floor(Math.random() * NODE_COUNT));
    }

    let frame = 0;
    const pulseIndices = new Set<number>(); // nodes currently pulsing
    let nextPulse = 80; // frames until next pulse trigger

    let lastTime = 0;
    const FRAME_INTERVAL = 40; // ~25 FPS target: fluid, dignified drift without CPU hogging

    const draw = (timestamp: number = 0) => {
      if (!canvas || !ctx) return;

      if (timestamp - lastTime < FRAME_INTERVAL && !reduced) {
        if (!pausedRef.current) {
          rafRef.current = requestAnimationFrame(draw);
        }
        return;
      }
      lastTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const nodes = nodesRef.current;
      frame++;

      // Occasional subtle pulse on a random accent node
      if (!reduced && frame >= nextPulse) {
        const candidates = [...accentIndices];
        pulseIndices.add(candidates[Math.floor(Math.random() * candidates.length)]);
        nextPulse = frame + 90 + Math.floor(Math.random() * 120);
      }

      // Move nodes (wrap at boundaries with soft bounce)
      if (!reduced) {
        nodes.forEach((n) => {
          n.x += n.vx;
          n.y += n.vy;

          // Soft edge bounce
          if (n.x < 0 || n.x > canvas.width) { n.vx *= -1; n.x = Math.max(0, Math.min(canvas.width, n.x)); }
          if (n.y < 0 || n.y > canvas.height) { n.vy *= -1; n.y = Math.max(0, Math.min(canvas.height, n.y)); }
        });
      }

      // Draw connection lines (limit per node to control density)
      nodes.forEach((a, i) => {
        let linksDrawn = 0;
        for (let j = i + 1; j < nodes.length && linksDrawn < MAX_LINKS_PER_NODE; j++) {
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_LINK_DISTANCE) {
            const alpha = 1 - dist / MAX_LINK_DISTANCE;
            const isGoldLine = accentIndices.has(i) && accentIndices.has(j);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = isGoldLine ? LINE_COLOR_GOLD : LINE_COLOR_BASE;
            ctx.globalAlpha = alpha * 0.6;
            ctx.lineWidth = 0.6;
            ctx.stroke();
            linksDrawn++;
          }
        }
      });

      // Draw nodes
      nodes.forEach((n, i) => {
        const isAccent = accentIndices.has(i);
        const isPulsing = pulseIndices.has(i);

        // Pulse effect — brief radial glow
        if (isPulsing) {
          const pulseSize = 8 + (frame % 30);
          const pulseAlpha = Math.max(0, 0.35 - (frame % 30) * 0.012);
          const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, pulseSize);
          grad.addColorStop(0, `rgba(212, 175, 55, ${pulseAlpha})`);
          grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
          ctx.globalAlpha = 1;
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(n.x, n.y, pulseSize, 0, Math.PI * 2);
          ctx.fill();

          // Expire pulse after ~30 frames
          if (frame % 30 === 0) pulseIndices.delete(i);
        }

        // Node dot
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, isAccent ? 2 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = isAccent ? NODE_COLOR_GOLD : NODE_COLOR_DIM;
        ctx.fill();
      });

      ctx.globalAlpha = 1;

      if (!reduced && !pausedRef.current) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    if (reduced) {
      draw(0);
      return;
    }

    rafRef.current = requestAnimationFrame(draw);

    // Pause when tab not visible
    const handleVisibility = () => {
      pausedRef.current = document.hidden;
      if (!document.hidden && !rafRef.current) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Pause during active scrolling to free CPU for rendering & touch events
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      pausedRef.current = true;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        pausedRef.current = document.hidden;
        if (!document.hidden && !rafRef.current) {
          rafRef.current = requestAnimationFrame(draw);
        }
      }, 150);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      initNodes();
      if (reduced) draw(0);
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [canMount]);

  if (!canMount) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        display: 'block',
      }}
    />
  );
}
